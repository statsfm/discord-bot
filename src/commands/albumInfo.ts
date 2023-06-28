import Api, { Album, OrderBySetting, Range } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { AlbumInfoCommand } from '../interactions/commands/albumInfo';
import { Analytics } from '../util/analytics';
import { createCommand } from '../util/Command';
import { createEmbed } from '../util/embed';
import { getDuration } from '../util/getDuration';
import { kAnalytics } from '../util/tokens';
import { URLs } from '../util/URLs';

const api = container.resolve(Api);
const analytics = container.resolve<Analytics>(kAnalytics);

interface AlbumsSearchResult {
  items: {
    albums: Album[];
  };
}

export default createCommand(AlbumInfoCommand)
  .registerAutocomplete(async ({ interaction, args: { album } }) => {
    if (album.length === 0) return interaction.respond([]);

    if (/(https?:\/\/)?stats\.fm\/album\/\d+/.test(album)) {
      const albumId = Number(album.split('/').pop());

      if (!albumId) return interaction.respond([]);

      try {
        const albumData = await api.albums.get(albumId);
        return interaction.respond([
          {
            name: `${albumData.name} by ${albumData.artists
              .splice(0, 2)
              .map((artist) => artist.name)
              .join(', ')}`,
            value: `${albumData.id}`,
          },
        ]);
      } catch (e) {
        return interaction.respond([]);
      }
    } else {
      const albumsRequest = await api.http.get('/search/elastic', {
        query: {
          query: album,
          limit: 20,
          type: 'album',
        },
      });

      const albumsData = albumsRequest.data as unknown as AlbumsSearchResult;

      return interaction.respond(
        albumsData.items.albums.map((album) => ({
          name: `${album.name} by ${album.artists
            .splice(0, 2)
            .map((artist) => artist.name)
            .join(', ')}`,
          value: `${album.id}`,
        }))
      );
    }
  })
  .registerChatInput(async ({ interaction, respond, args, statsfmUser }) => {
    if (isNaN(Number(args.album)))
      return respond(interaction, {
        content: 'Make sure to select an album from the option menu.',
        ephemeral: true,
      });
    await interaction.deferReply();

    const albumId = Number(args.album);
    let albumInfo: Album;
    try {
      albumInfo = await api.albums.get(albumId);
    } catch (e) {
      return respond(interaction, {
        content: 'It seems like I can not find this album.',
      });
    }
    const albumTopTracks = await api.albums.tracks(albumId);

    const embed = createEmbed()
      .setTitle(albumInfo.name)
      .setThumbnail(albumInfo.image)
      .setURL(URLs.AlbumUrl(albumInfo.id))
      .addFields([
        {
          name: `Artist${albumInfo.artists.length > 1 ? 's' : ''}`,
          value: albumInfo.artists
            .map((artist) => `[${artist.name}](${URLs.ArtistUrl(artist.id)})`)
            .join(', '),
        },
        {
          name: 'Release Date',
          value: `<t:${Math.floor(
            new Date(albumInfo.releaseDate).getTime() / 1000
          )}:d>`,
        },
        {
          name: `Track${albumTopTracks.length > 1 ? 's' : ''}`,
          value: albumTopTracks
            .splice(0, 5)
            .map(
              (track, i) =>
                `${i + 1}. [${track.name}](${URLs.TrackUrl(
                  track.id
                )}) - ${getDuration(track.durationMs)}`
            )
            .join('\n'),
        },
        ...(albumInfo.genres.length > 0
          ? [
              {
                name: `Genre${albumInfo.genres.length > 1 ? 's' : ''}`,
                value: albumInfo.genres.join(', '),
              },
            ]
          : []),
      ]);

    if (statsfmUser) {
      const userTopTracks =
        statsfmUser.privacySettings.topTracks &&
        statsfmUser.orderBy !== OrderBySetting.PLATFORM
          ? await api.users
              .topTracksFromAlbums(statsfmUser.id, albumInfo.id, {
                range: Range.LIFETIME,
              })
              .catch(() => [])
          : [];

      if (userTopTracks.length > 0)
        embed.addFields([
          {
            name: `Your Top Track${
              userTopTracks.length > 1 ? 's' : ''
            } - Lifetime`,
            value: userTopTracks
              .splice(0, 5)
              .map(
                (top, i) =>
                  `${i + 1}. [${top.track.name}](${URLs.TrackUrl(
                    top.track.id
                  )}) - ${getDuration(top.playedMs!)}`
              )
              .join('\n'),
          },
        ]);
    }

    await analytics.trackEvent('ALBUM_INFO', interaction.user.id);

    return respond(interaction, {
      embeds: [embed],
    });
  })
  .build();
