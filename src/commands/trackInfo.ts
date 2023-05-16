import Api, { Track, Range } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { TrackInfoCommand } from '../interactions/commands/trackInfo';
import { createCommand } from '../util/Command';
import { createEmbed } from '../util/embed';
import { getDuration } from '../util/getDuration';
import { URLs } from '../util/URLs';

const api = container.resolve(Api);

interface TracksSearchResult {
  items: {
    tracks: Track[]
  }
}

export default createCommand(TrackInfoCommand)
  .registerAutocomplete(async ({ interaction, args: { track } }) => {
    if (track.length === 0) return interaction.respond([]);

    if (/(https?:\/\/)?stats\.fm\/track\/\d+/.test(track)) {
      const trackId = Number(track.split('/').pop());

      if (!trackId) return interaction.respond([]);

      try {
        const trackData = await api.tracks.get(trackId);
        return interaction.respond([{
          name: `${trackData.name} by ${trackData.artists.splice(0, 2).map(artist => artist.name).join(', ')}`,
          value: `${trackData.id}`
        }]);
      } catch (e) {
        return interaction.respond([]);
      }
    } else {
      const tracksRequest = await api.http.get('/search/elastic', {
        query: {
          query: track,
          limit: 20,
          type: 'track'
        }
      });

      const tracksData = tracksRequest.data as unknown as TracksSearchResult;

      return interaction.respond(tracksData.items.tracks.map(track => ({
        name: `${track.name} by ${track.artists.splice(0, 2).map(artist => artist.name).join(', ')}`,
        value: `${track.id}`
      })));
    }

  })
  .registerChatInput(async ({ interaction, respond, args, statsfmUser }) => {
    if (isNaN(Number(args.track))) return respond(interaction, {
      content: 'Make sure to select a track from the option menu.',
      ephemeral: true
    });
    await interaction.deferReply();

    const trackId = Number(args.track);
    let trackInfo: Track;
    try {
      trackInfo = await api.tracks.get(trackId);
    } catch (e) {
      return respond(interaction, {
        content: 'It seems like I can not find this track.'
      });
    }

    const embed = createEmbed()
      .setTitle(trackInfo.name)
      .setURL(URLs.TrackUrl(trackInfo.id))
      .setThumbnail(trackInfo.albums[0].image)
      .addFields([
        {
          name: `Artist${trackInfo.artists.length > 1 ? 's' : ''}`,
          value: trackInfo.artists.map(artist => `[${artist.name}](${URLs.ArtistUrl(artist.id)})`).join(', ')
        },
        {
          name: `Album${trackInfo.albums.length > 1 ? 's' : ''}`,
          value: trackInfo.albums.splice(0, 5).map(album => `[${album.name}](${URLs.AlbumUrl(album.id)})`).join(', ')
        },
        {
          name: 'Duration',
          value: getDuration(trackInfo.durationMs)
        },
      ]);

    if (statsfmUser) {
      const trackStats = statsfmUser.privacySettings.streamStats ? await api.users.trackStats(statsfmUser.id, trackId, { range: Range.LIFETIME }) : null;

      if (trackStats) {
        embed.addFields([
          {
            name: 'Your total streams - Lifetime',
            value: `${trackStats.count.toLocaleString()} streams`,
            inline: true
          },
          {
            name: 'Time spent listening - Lifetime',
            value: getDuration(trackStats.durationMs),
            inline: true
          }
        ])
      }
    }

    return respond(interaction, {
      embeds: [embed]
    })
  }).build();
