import { Api, Range } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import type { ChartsCommand } from '../../../interactions';
import { Analytics } from '../../../util/analytics';
import type { SubcommandFunction } from '../../../util/Command';
import { createEmbed } from '../../../util/embed';
import {
  createPaginationComponentTypes,
  createPaginationManager,
} from '../../../util/PaginationManager';
import { kAnalytics } from '../../../util/tokens';
import { URLs } from '../../../util/URLs';

const statsfmApi = container.resolve(Api);
const analytics = container.resolve<Analytics>(kAnalytics);

const GlobalChartsTopArtistsComponents = createPaginationComponentTypes(
  'globalcharts-artists'
);

export const topArtistsSubCommand: SubcommandFunction<
  typeof ChartsCommand['options']['artists']
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

  const topArtistsData = await statsfmApi.charts.topArtists({
    range,
  });

  await analytics.trackEvent(
    `CHARTS_TOP_ARTISTS_${range}`,
    interaction.user.id
  );

  const pagination = createPaginationManager(
    topArtistsData,
    (currPage, totalPages, currData) => {
      return createEmbed()
        .setAuthor({
          name: `Global top artists - ${rangeDisplay}`,
        })
        .setDescription(
          currData
            .map((artistData) => {
              const artistUrl = URLs.ArtistUrl(artistData.artist.id);

              return `${artistData.position}. [${
                artistData.artist.name
              }](${artistUrl}) • ${artistData.streams ?? 0} streams`;
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
      GlobalChartsTopArtistsComponents
    )
  );

  pagination.manageCollector(
    message,
    GlobalChartsTopArtistsComponents,
    interaction.user
  );

  return message;
};
