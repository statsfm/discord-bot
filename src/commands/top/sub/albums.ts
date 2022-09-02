import { Api, Range, TopAlbum } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import type { TopCommand } from '../../../interactions';
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

const TopAlbumComponents = createPaginationComponentTypes('top-albums');

export const topAlbumsSubCommand: SubcommandFunction<
  typeof TopCommand['options']['2']
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

  let topAlbumsData: TopAlbum[] = [];

  try {
    topAlbumsData = await statsfmApi.users.topAlbums(data.userId, {
      range,
    });
  } catch (_) {
    return respond(interaction, {
      embeds: [unexpectedErrorEmbed(targetUser)],
    });
  }

  const pagination = createPaginationManager(
    topAlbumsData,
    (currPage, totalPages, currData) => {
      return createEmbed()
        .setAuthor({
          name: `${targetUser.username}'s top ${rangeDisplay} albums`,
          url: URLs.ProfileUrl(data.userId),
        })
        .setDescription(
          currData
            .map((albumData) => {
              const albumUrl = URLs.AlbumUrl(albumData.album.id);

              return `${albumData.position}. [${
                albumData.album.name
              }](${albumUrl}) • ${
                albumData.streams ?? 0
              } streams • ${getDuration(albumData.playedMs ?? 0)}`;
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
      TopAlbumComponents
    )
  );

  pagination.manageCollector(message, TopAlbumComponents, interaction.user);

  return message;
};
