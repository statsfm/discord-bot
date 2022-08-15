import { Api, Range, TopTrack } from '@statsfm/statsfm.js';
import { APIInteraction, InteractionResponseType } from 'discord-api-types/v9';
import { container } from 'tsyringe';
import type { TopCommand } from '../../../interactions/commands/top';
import type { ArgumentsOf } from '../../../util/ArgumentsOf';
import type { RespondFunction } from '../../../util/Command';
import {
  createEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../../../util/embed';
import { getDuration } from '../../../util/getDuration';
import { getUserByDiscordId } from '../../../util/getUserByDiscordId';
import { getUserFromInteraction } from '../../../util/getUserFromInteraction';
import { URLs } from '../../../util/URLs';

const statsfmApi = container.resolve(Api);

export async function topTracks(
  interaction: APIInteraction,
  args: ArgumentsOf<typeof TopCommand['options']['2']>,
  respond: RespondFunction
): Promise<void> {
  const interactionUser = getUserFromInteraction(interaction);
  const targetUser =
    args.user?.member?.user ?? args.user?.user ?? interactionUser;
  const data = await getUserByDiscordId(targetUser.id);
  if (!data)
    return respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [notLinkedEmbed(targetUser)],
      },
    });

  let range = Range.WEEKS;
  let rangeDisplay = 'past 4 weeks';

  if (args.range === '6-months') {
    range = Range.MONTHS;
    rangeDisplay = 'past 6 months';
  }

  if (args.range === 'lifetime') {
    range = Range.LIFETIME;
    rangeDisplay = 'lifetime';
  }

  let topTracksData: TopTrack[] = [];

  try {
    topTracksData = await statsfmApi.users.topTracks(data.userId, {
      range,
    });
  } catch (_) {
    return respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [unexpectedErrorEmbed(targetUser)],
      },
    });
  }

  const embedDescription = topTracksData
    .slice(0, 10)
    .map((tracksData) => {
      const trackUrl = URLs.TrackUrl(tracksData.track.id);

      return `${tracksData.position}. [${
        tracksData.track.name
      }](${trackUrl}) • ${tracksData.streams ?? 0} streams • ${getDuration(
        tracksData.playedMs ?? 0
      )}`;
    })
    .join('\n');

  return respond(interaction, {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      embeds: [
        createEmbed()
          .setTitle(`${targetUser.username}'s top tracks ${rangeDisplay}`)
          .setDescription(embedDescription)
          .toJSON(),
      ],
    },
  });
}
