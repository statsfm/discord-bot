import { Api, Range } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import type { ChartsCommand } from '../../../interactions';
import type { SubcommandFunction } from '../../../util/Command';
import { createEmbed } from '../../../util/embed';
import {
  createPaginationComponentTypes,
  createPaginationManager,
} from '../../../util/PaginationManager';
import { URLs } from '../../../util/URLs';

const statsfmApi = container.resolve(Api);

const GlobalChartsTopAlbumComponents = createPaginationComponentTypes(
  'globalcharts-albums'
);

export const topAlbumsSubCommand: SubcommandFunction<
  typeof ChartsCommand['options']['albums']
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

  const topAlbumsData = await statsfmApi.charts.topAlbums({
    range,
  });

  const pagination = createPaginationManager(
    topAlbumsData,
    (currPage, totalPages, currData) => {
      return createEmbed()
        .setAuthor({
          name: `Global top albums - ${rangeDisplay}`,
        })
        .setDescription(
          currData
            .map((albumData) => {
              const albumUrl = URLs.AlbumUrl(albumData.album.id);

              return `${albumData.position}. [${albumData.album.name
                }](${albumUrl}) • ${albumData.streams ?? 0} streams`;
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
      GlobalChartsTopAlbumComponents
    )
  );

  pagination.manageCollector(
    message,
    GlobalChartsTopAlbumComponents,
    interaction.user
  );

  return message;
};
