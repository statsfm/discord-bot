import { Api, Range, StreamStats, UserPublic } from '@statsfm/statsfm.js';
import {
  APIEmbedField,
  APIInteraction,
  ButtonStyle,
  ComponentType,
  InteractionResponseType,
} from 'discord-api-types/v9';
import { container } from 'tsyringe';

import { ProfileCommand } from '../interactions';
import type { ArgumentsOf } from '../util/ArgumentsOf';
import type { ICommand, RespondFunction } from '../util/Command';
import {
  createEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';

import { getUserByDiscordId } from '../util/getUserByDiscordId';
import { getUserFromInteraction } from '../util/getUserFromInteraction';
import { URLs } from '../util/URLs';

const statsfmApi = container.resolve(Api);

export default class implements ICommand {
  commandObject = ProfileCommand;

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof ProfileCommand>,
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
      return void respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [notLinkedEmbed(interactionUser, targetUser)],
        },
      });

    let user: UserPublic;

    try {
      user = await statsfmApi.users.get(data.userId);
    } catch (_) {
      return void respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [unexpectedErrorEmbed(interactionUser, targetUser)],
        },
      });
    }

    if (!user)
      return void respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [notLinkedEmbed(interactionUser, targetUser)],
        },
      });

    let stats: StreamStats;

    try {
      stats = await statsfmApi.users.stats(data.userId, {
        range: Range.LIFETIME,
      });
    } catch (_) {
      stats = {
        count: -1,
        durationMs: -1,
      };
    }

    const fields: APIEmbedField[] = [
      {
        name: 'Pronouns',
        value: user.profile?.pronouns ?? 'Unknown',
        inline: stats.count != -1,
      },
    ];

    if (stats.count != -1) {
      fields.push({
        name: 'Streams',
        value: stats.count.toLocaleString(),
        inline: true,
      });
      fields.push({
        name: 'Minutes streamed',
        value: `${Math.round(
          (stats.durationMs ?? 0) / 1000 / 60
        ).toLocaleString()} minutes`,
        inline: true,
      });
    }

    fields.push({
      name: 'Bio',
      value: user.profile?.bio ?? '*No bio*',
    });

    await respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          createEmbed(interactionUser)
            .setTimestamp()
            .setThumbnail(user.image)
            .setAuthor({
              name: user.displayName,
            })
            .addFields(fields)
            .toJSON(),
        ],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.Button,
                label: 'View on Stats.fm',
                style: ButtonStyle.Link,
                url: URLs.ProfileUrl(user.customId ?? user.id),
                emoji: {
                  name: '🔗',
                },
              },
              {
                type: ComponentType.Button,
                label: 'View on Spotify',
                style: ButtonStyle.Link,
                url: URLs.SpotifyProfileUrl(user.id),
                emoji: {
                  id: '998272544870252624',
                },
              },
            ],
          },
        ],
      },
    });
  }
}
