import { Api, Range, TopTrack } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import type { TopCommand } from '../../../interactions/commands/top';
import type { SubcommandFunction } from '../../../util/Command';
import {
  createEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../../../util/embed';
import { getDuration } from '../../../util/getDuration';
import { getUserByDiscordId } from '../../../util/getUserByDiscordId';
import {
  createPaginationComponentTypes,
  createPaginationManager,
} from '../../../util/PaginationManager';
import { URLs } from '../../../util/URLs';

const statsfmApi = container.resolve(Api);

const TopTracksComponents = createPaginationComponentTypes('top-tracks');

export const topTracksSubCommand: SubcommandFunction<
  typeof TopCommand['options']['1']
> = async (interaction, args, respond) => {
  const targetUser = args.user?.user ?? interaction.user;
  const data = await getUserByDiscordId(targetUser.id);
  if (!data)
    return respond(interaction, {
      embeds: [notLinkedEmbed(targetUser)],
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
      embeds: [unexpectedErrorEmbed(targetUser)],
    });
  }

  const pagination = createPaginationManager(
    topTracksData,
    (currPage, totalPages, currData) => {
      return createEmbed()
        .setAuthor({
          name: `${targetUser.username}'s top ${rangeDisplay} tracks`,
          url: URLs.ProfileUrl(data.userId),
        })
        .setDescription(
          currData
            .map((tracksData) => {
              const trackUrl = URLs.TrackUrl(tracksData.track.id);

              return `${tracksData.position}. [${
                tracksData.track.name
              }](${trackUrl}) • ${
                tracksData.streams ?? 0
              } streams • ${getDuration(tracksData.playedMs ?? 0)}`;
            })
            .join('\n')
        )
        .setFooter({ text: `Page ${currPage}/${totalPages}` });
    }
  );

  const message = await respond(
    interaction,
    pagination.createMessage<'reply'>(
      await pagination.current(),
      TopTracksComponents
    )
  );

  pagination.manageCollector(message, TopTracksComponents, targetUser);

  return message;
};
