import { Api, Range } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import type { ChartsCommand } from '../../../interactions';
import { Analytics } from '../../../util/Analytics';

import type { SubcommandFunction } from '../../../util/Command';
import { createEmbed } from '../../../util/embed';
import {
  createPaginationComponentTypes,
  createPaginationManager
} from '../../../util/PaginationManager';
import { URLs } from '../../../util/URLs';

const statsfmApi = container.resolve(Api);
const analytics = container.resolve(Analytics);

const TopTracksComponents = createPaginationComponentTypes('top-tracks');

export const topTracksSubCommand: SubcommandFunction<
  (typeof ChartsCommand)['options']['tracks']
> = async ({ interaction, args, respond }) => {
  let range = Range.TODAY;
  let rangeDisplay = 'today';

  if (args.range === '4-weeks') {
    range = Range.WEEKS;
    rangeDisplay = 'past 4 weeks';
  }

  if (args.range === '6-months') {
    range = Range.MONTHS;
    rangeDisplay = 'past 6 months';
  }
  if (args.range === 'lifetime') {
    range = Range.LIFETIME;
    rangeDisplay = 'lifetime';
  }

  const topTracksData = await statsfmApi.charts.topTracks({
    range
  });

  await analytics.track(`CHARTS_TOP_TRACKS_${range}`);

  const pagination = createPaginationManager(topTracksData, (currPage, totalPages, currData) => {
    return createEmbed()
      .setAuthor({
        name: `Global top tracks - ${rangeDisplay}`
      })
      .setDescription(
        currData
          .map((tracksData) => {
            const trackUrl = URLs.TrackUrl(tracksData.track.id);

            return `${tracksData.position}. [${
              tracksData.track.name
            }](${trackUrl}) • ${tracksData.streams ?? 0} streams`;
          })
          .join('\n')
      )
      .setFooter({ text: `Page ${currPage}/${totalPages}` });
  });

  const message = await respond(
    interaction,
    pagination.createMessage<'reply'>(await pagination.current(), TopTracksComponents)
  );

  pagination.manageCollector(message, TopTracksComponents, interaction.user);

  return message;
};
