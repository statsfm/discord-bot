import Api, { Artist, Range } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { ArtistInfoCommand } from '../interactions/commands/artistInfo';
import { createCommand } from '../util/Command';
import { createEmbed } from '../util/embed';
import { getDuration } from '../util/getDuration';
import { URLs } from '../util/URLs';

const api = container.resolve(Api);

interface ArtistsSearchResult {
  items: {
    artists: Artist[]
  }
}

export default createCommand(ArtistInfoCommand)
  .registerAutocomplete(async ({ interaction, args: { artist } }) => {
    if (artist.length === 0) return interaction.respond([]);

    if (/(https?:\/\/)?stats\.fm\/artist\/\d+/.test(artist)) {
      const artistId = Number(artist.split('/').pop());

      if (!artistId) return interaction.respond([]);

      try {
        const artistData = await api.artists.get(artistId);
        return interaction.respond([{
          name: `${artistData.name} - ${artistData.followers.toLocaleString()} followers`,
          value: `${artistData.id}`
        }]);
      } catch (e) {
        return interaction.respond([]);
      }
    } else {
      const artistsRequest = await api.http.get('/search/elastic', {
        query: {
          query: artist,
          limit: 20,
          type: 'artist'
        }
      });

      const artistsData = artistsRequest.data as unknown as ArtistsSearchResult;

      return interaction.respond(artistsData.items.artists.map(artist => ({
        name: `${artist.name} - ${artist.followers.toLocaleString()} followers`,
        value: `${artist.id}`
      })));
    }

  })
  .registerChatInput(async ({ interaction, respond, args, statsfmUser }) => {
    if (isNaN(Number(args.artist))) return respond(interaction, {
      content: 'Make sure to select an artist from the option menu.',
      ephemeral: true
    });
    await interaction.deferReply();

    const artistId = Number(args.artist);
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
          value: artistInfo.followers.toLocaleString(),
        },
        {
          name: `Top Album${artistTopAlbums.length > 1 ? 's' : ''}`,
          value: artistTopAlbums.splice(0, 5).map((album, i) => `${i + 1}. [${album.name}](${URLs.AlbumUrl(album.id)})`).join('\n'),
          inline: true
        },
        {
          name: `Top Track${artistTopTracks.length > 1 ? 's' : ''}`,
          value: artistTopTracks.splice(0, 5).map((track, i) => `${i + 1}. [${track.name}](${URLs.TrackUrl(track.id)})`).join('\n'),
          inline: true
        },
      ]);

    if (statsfmUser) {
      const userTopTracks = statsfmUser.privacySettings.topTracks ? await api.users.topTracksFromArtist(statsfmUser.id, artistInfo.id, { range: Range.LIFETIME }) : [];
      const userTopAlbums = statsfmUser.privacySettings.topAlbums ? await api.users.topAlbumsFromArtist(statsfmUser.id, artistInfo.id, { range: Range.LIFETIME }) : [];

      if (userTopAlbums.length > 0) embed.addFields([
        {
          name: `Your Top Album${userTopAlbums.length > 1 ? 's' : ''} - Lifetime`,
          value: userTopAlbums.splice(0, 5).map((top, i) => `${i + 1}. [${top.album.name}](${URLs.AlbumUrl(top.album.id)}) - ${getDuration(top.playedMs!)}`).join('\n'),
        },
      ]);

      if (userTopTracks.length > 0) embed.addFields([
        {
          name: `Your Top Track${userTopTracks.length > 1 ? 's' : ''} - Lifetime`,
          value: userTopTracks.splice(0, 5).map((top, i) => `${i + 1}. [${top.track.name}](${URLs.TrackUrl(top.track.id)}) - ${getDuration(top.playedMs!)}`).join('\n'),
        },
      ]);
    }

    if (artistInfo.image) embed.setThumbnail(artistInfo.image);

    return respond(interaction, {
      embeds: [embed]
    })
  }).build();
