import { APIInteraction, InteractionResponseType } from 'discord-api-types/v9';

import { RecentlyStreamedCommand } from '../interactions';
import type { ArgumentsOf } from '../util/ArgumentsOf';
import { Command, RespondFunction } from '../util/Command';

import { getUserByDiscordId } from '../util/getUserByDiscordId';
import { getUserFromInteraction } from '../util/getUserFromInteraction';
import {
  createEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';
import { Api, RecentlyPlayedTrack } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { URLs } from '../util/URLs';

const statsfmApi = container.resolve(Api);

export default class RecentlyStreamed extends Command<
  typeof RecentlyStreamedCommand
> {
  constructor() {
    super({
      commandObject: RecentlyStreamedCommand,
    });
  }

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof RecentlyStreamedCommand>,
    respond: RespondFunction
  ): Promise<void> {
    await respond(interaction, {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
    });

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

    let recentlyStreamed: RecentlyPlayedTrack[] = [];

    try {
      recentlyStreamed = await statsfmApi.users.recentlyStreamed(data.userId);
    } catch (_) {
      return respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [unexpectedErrorEmbed(targetUser)],
        },
      });
    }

    if (recentlyStreamed.length === 0)
      return respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [
            createEmbed()
              .setTitle(`${targetUser.username} has not streamed recently`)
              .toJSON(),
          ],
        },
      });

    const embedDescription = recentlyStreamed
      .slice(0, 10)
      .map((stream) => {
        const trackURL = URLs.TrackUrl(stream.track.id);
        const artists = stream.track.artists
          .map((artist) => `[${artist.name}](${URLs.ArtistUrl(artist.id)})`)
          .join(', ');

        return `- **[${
          stream.track.name
        }](${trackURL})** by **${artists}**  (<t:${Math.round(
          new Date(stream.endTime).getTime() / 1000
        )}:R>)`;
      })
      .join('\n');

    await respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          createEmbed()
            .setAuthor({
              name: `${targetUser.username}'s recently streamed tracks`,
              url: URLs.ProfileUrl(data.userId),
            })
            .setDescription(embedDescription)
            .toJSON(),
        ],
      },
    });
  }
}
