import { Api, UserPublic } from '@statsfm/statsfm.js';
import {
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

  guilds = ['901602034443227166'];

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
          embeds: [
            createEmbed(interactionUser)
              .setTitle(
                `${targetUser.username} did not link their Discord account to their Stats.fm account`
              )
              .toJSON(),
          ],
        },
      });

    let user: UserPublic | undefined;

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
            .addFields([
              {
                name: 'Pronouns',
                value: user.profile?.pronouns ?? 'Unknown',
              },
              {
                name: 'Bio',
                value: user.profile?.bio ?? '*No bio*',
              },
            ])
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
            ],
          },
        ],
      },
    });
  }
}
