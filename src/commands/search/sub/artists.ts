import { SearchCommand } from '../../../interactions/commands/search';
import { SubcommandFunction } from '../../../util/Command';
import Api, { Artist, OrderBySetting, Range } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { Analytics } from '../../../util/Analytics';
import { createEmbed } from '../../../util/embed';
import { getDuration } from '../../../util/getDuration';
import { URLs } from '../../../util/URLs';

const api = container.resolve(Api);
const analytics = container.resolve(Analytics);

export const searchArtistsSubCommand: SubcommandFunction<
  (typeof SearchCommand)['options']['artists']
> = async ({ interaction, args, statsfmUser, respond }) => {
  if (isNaN(Number(args.query)))
    return respond(interaction, {
      content: 'Make sure to select an artist from the option menu.',
      ephemeral: true
    });
  await interaction.deferReply();

  const artistId = Number(args.query);
  let artistInfo: Artist;
  try {
    artistInfo = await api.artists.get(artistId);
  } catch (e) {
    return respond(interaction, {
      content: 'It seems like I can not find this artist.'
    });
  }
  const artistTopTracks = await api.artists.tracks(artistInfo.id);
  const artistTopAlbums = await api.artists.albums(artistId);

  const embed = createEmbed()
    .setTitle(artistInfo.name)
    .setURL(URLs.ArtistUrl(artistInfo.id))
    .addFields([
      {
        name: 'Followers',
        value: artistInfo.followers.toLocaleString()
      }
    ]);

  if (artistTopAlbums.length > 0)
    embed.addFields([
      {
        name: `Top Album${artistTopAlbums.length > 1 ? 's' : ''}`,
        value: artistTopAlbums
          .splice(0, 5)
          .map((album, i) => `${i + 1}. [${album.name}](${URLs.AlbumUrl(album.id)})`)
          .join('\n'),
        inline: true
      }
    ]);
  else
    embed.addFields([
      {
        name: `Top Albums`,
        value: 'No albums found.',
        inline: true
      }
    ]);

  if (artistTopTracks.length > 0)
    embed.addFields([
      {
        name: `Top Track${artistTopTracks.length > 1 ? 's' : ''}`,
        value: artistTopTracks
          .splice(0, 5)
          .map((track, i) => `${i + 1}. [${track.name}](${URLs.TrackUrl(track.id)})`)
          .join('\n'),
        inline: true
      }
    ]);
  else
    embed.addFields([
      {
        name: `Top Tracks`,
        value: 'No tracks found.',
        inline: true
      }
    ]);

  if (statsfmUser) {
    const userTopTracks =
      statsfmUser.privacySettings.topTracks && statsfmUser.orderBy !== OrderBySetting.PLATFORM
        ? await api.users
            .topTracksFromArtist(statsfmUser.id, artistInfo.id, {
              range: Range.LIFETIME
            })
            .catch(() => [])
        : [];
    const userTopAlbums =
      statsfmUser.privacySettings.topTracks && statsfmUser.orderBy !== OrderBySetting.PLATFORM
        ? await await api.users
            .topAlbumsFromArtist(statsfmUser.id, artistInfo.id, {
              range: Range.LIFETIME
            })
            .catch(() => [])
        : [];

    if (userTopAlbums.length > 0)
      embed.addFields([
        {
          name: `Your Top Album${userTopAlbums.length > 1 ? 's' : ''} - Lifetime`,
          value: userTopAlbums
            .splice(0, 5)
            .map(
              (top, i) =>
                `${i + 1}. [${top.album.name}](${URLs.AlbumUrl(
                  top.album.id
                )}) - ${getDuration(top.playedMs!)}`
            )
            .join('\n')
        }
      ]);

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

  if (artistInfo.image) embed.setThumbnail(artistInfo.image);

  await analytics.track('SEARCH_ARTIST_INFO');

  return respond(interaction, {
    embeds: [embed]
  });
};
