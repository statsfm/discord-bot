import { RecentlyStreamedCommand } from '../interactions';
import { createCommand } from '../util/Command';

import { getUserByDiscordId } from '../util/getUserByDiscordId';
import {
  createEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';
import { Api, RecentlyPlayedTrack } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { URLs } from '../util/URLs';
import {
  createPaginationComponentTypes,
  createPaginationManager,
} from '../util/PaginationManager';

const statsfmApi = container.resolve(Api);

const RecentlyPlayingComponents =
  createPaginationComponentTypes('recently-playing');

export default createCommand(RecentlyStreamedCommand)
  .registerChatInput(async (interaction, args, respond) => {
    await interaction.deferReply();
    const targetUser = args.user?.user ?? interaction.user;
    const data = await getUserByDiscordId(targetUser.id);
    if (!data)
      return respond(interaction, {
        embeds: [notLinkedEmbed(targetUser)],
      });

    let recentlyStreamed: RecentlyPlayedTrack[] = [];

    try {
      recentlyStreamed = await statsfmApi.users.recentlyStreamed(data.userId);
    } catch (_) {
      return respond(interaction, {
        embeds: [unexpectedErrorEmbed(targetUser)],
      });
    }

    if (recentlyStreamed.length === 0)
      return respond(interaction, {
        embeds: [
          createEmbed()
            .setTitle(`${targetUser.username} has not streamed recently`)
            .toJSON(),
        ],
      });

    const pagination = createPaginationManager(
      recentlyStreamed,
      (currPage, totalPages, currData) => {
        return createEmbed()
          .setAuthor({
            name: `${targetUser.username}'s recently streamed tracks`,
            url: URLs.ProfileUrl(data.userId),
          })
          .setDescription(
            currData
              .map((stream) => {
                const trackURL = URLs.TrackUrl(stream.track.id);
                const artists = stream.track.artists
                  .map(
                    (artist) => `[${artist.name}](${URLs.ArtistUrl(artist.id)})`
                  )
                  .join(', ');

                return `- **[${
                  stream.track.name
                }](${trackURL})** by **${artists}**  (<t:${Math.round(
                  new Date(stream.endTime).getTime() / 1000
                )}:R>)`;
              })
              .join('\n')
          )
          .setFooter({ text: `Page ${currPage} of ${totalPages}` });
      }
    );

    const message = await respond(
      interaction,
      pagination.createMessage<'reply'>(
        await pagination.current(),
        RecentlyPlayingComponents
      )
    );

    pagination.manageCollector(
      message,
      RecentlyPlayingComponents,
      interaction.user
    );

    return message;
  })
  .build();
