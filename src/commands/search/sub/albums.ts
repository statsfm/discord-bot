import { SearchCommand } from '../../../interactions/commands/search';
import { SubcommandFunction } from '../../../util/Command';
import Api, { Album, OrderBySetting, Range } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { Analytics } from '../../../util/Analytics';
import { createEmbed } from '../../../util/embed';
import { getDuration } from '../../../util/getDuration';
import { URLs } from '../../../util/URLs';

const api = container.resolve(Api);
const analytics = container.resolve(Analytics);

export const searchAlbumsSubCommand: SubcommandFunction<
  (typeof SearchCommand)['options']['albums']
> = async ({ interaction, args, statsfmUser, respond }) => {
  if (isNaN(Number(args.query)))
    return respond(interaction, {
      content: 'Make sure to select an album from the option menu.',
      ephemeral: true
    });
  await interaction.deferReply();

  const albumId = Number(args.query);
  let albumInfo: Album;
  try {
    albumInfo = await api.albums.get(albumId);
  } catch (e) {
    return respond(interaction, {
      content: 'It seems like I can not find this album.'
    });
  }
  const albumTracks = await api.albums.tracks(albumId);

  const embed = createEmbed()
    .setTitle(albumInfo.name)
    .setThumbnail(albumInfo.image)
    .setURL(URLs.AlbumUrl(albumInfo.id))
    .addFields([
      {
        name: `Artist${albumInfo.artists.length > 1 ? 's' : ''}`,
        value: albumInfo.artists
          .map((artist) => `[${artist.name}](${URLs.ArtistUrl(artist.id)})`)
          .join(', ')
      },
      {
        name: 'Release Date',
        value: `<t:${Math.floor(new Date(albumInfo.releaseDate).getTime() / 1000)}:d>`
      },
      ...(albumTracks.length > 0
        ? [
            {
              name: `Track${albumTracks.length > 1 ? 's' : ''}`,
              value: albumTracks
                .splice(0, 5)
                .map(
                  (track, i) =>
                    `${i + 1}. [${track.name}](${URLs.TrackUrl(
                      track.id
                    )}) - ${getDuration(track.durationMs)}`
                )
                .join('\n')
            }
          ]
        : [
            {
              name: 'Tracks',
              value: 'No tracks found.'
            }
          ]),
      ...(albumInfo.genres.length > 0
        ? [
            {
              name: `Genre${albumInfo.genres.length > 1 ? 's' : ''}`,
              value: albumInfo.genres.join(', ')
            }
          ]
        : [])
    ]);

  if (statsfmUser) {
    const userTopTracks =
      statsfmUser.privacySettings.topTracks && statsfmUser.orderBy !== OrderBySetting.PLATFORM
        ? await api.users
            .topTracksFromAlbums(statsfmUser.id, albumInfo.id, {
              range: Range.LIFETIME
            })
            .catch(() => [])
        : [];

    if (userTopTracks.length > 0)
      embed.addFields([
        {
          name: `Your Top Track${userTopTracks.length > 1 ? 's' : ''} - Lifetime`,
          value: userTopTracks
            .splice(0, 5)
            .map(
              (top, i) =>
                `${i + 1}. [${top.track.name}](${URLs.TrackUrl(
                  top.track.id
                )}) - ${getDuration(top.playedMs!)}`
            )
            .join('\n')
        }
      ]);
  }

  await analytics.track('SEARCH_ALBUMS_INFO');

  return respond(interaction, {
    embeds: [embed]
  });
};
