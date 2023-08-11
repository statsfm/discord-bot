import { SearchCommand } from '../../../interactions/commands/search';
import { SubcommandFunction } from '../../../util/Command';
import Api, { Range, Track } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { Analytics } from '../../../util/analytics';
import { createEmbed } from '../../../util/embed';
import { getDuration } from '../../../util/getDuration';
import { kAnalytics } from '../../../util/tokens';
import { URLs } from '../../../util/URLs';

const api = container.resolve(Api);
const analytics = container.resolve<Analytics>(kAnalytics);

export const searchTracksSubCommand: SubcommandFunction<
  (typeof SearchCommand)['options']['tracks']
> = async ({ interaction, args, statsfmUser, respond }) => {
  if (isNaN(Number(args.query)))
    return respond(interaction, {
      content: 'Make sure to select a track from the option menu.',
      ephemeral: true,
    });
  await interaction.deferReply();

  const trackId = Number(args.query);
  let trackInfo: Track;
  try {
    trackInfo = await api.tracks.get(trackId);
  } catch (e) {
    return respond(interaction, {
      content: 'It seems like I can not find this track.',
    });
  }

  const embed = createEmbed()
    .setTitle(trackInfo.name)
    .setURL(URLs.TrackUrl(trackInfo.id))
    .setThumbnail(trackInfo.albums[0].image)
    .addFields([
      {
        name: `Artist${trackInfo.artists.length > 1 ? 's' : ''}`,
        value: trackInfo.artists
          .map((artist) => `[${artist.name}](${URLs.ArtistUrl(artist.id)})`)
          .join(', '),
      },
      {
        name: `Album${trackInfo.albums.length > 1 ? 's' : ''}`,
        value: trackInfo.albums
          .splice(0, 5)
          .map((album) => `[${album.name}](${URLs.AlbumUrl(album.id)})`)
          .join(', '),
      },
      {
        name: 'Duration',
        value: getDuration(trackInfo.durationMs),
      },
    ]);

  if (statsfmUser) {
    const trackStats = statsfmUser.privacySettings.streamStats
      ? await api.users.trackStats(statsfmUser.id, trackId, {
          range: Range.LIFETIME,
        })
      : null;

    if (trackStats) {
      embed.addFields([
        {
          name: 'Your total streams - Lifetime',
          value: `${trackStats.count.toLocaleString()} streams`,
          inline: true,
        },
        {
          name: 'Time spent listening - Lifetime',
          value: getDuration(trackStats.durationMs) || 'None',
          inline: true,
        },
      ]);
    }
  }

  await analytics.trackEvent('SEARCH_TRACK_INFO', interaction.user.id);

  return respond(interaction, {
    embeds: [embed],
  });
};
