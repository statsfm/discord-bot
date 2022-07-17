import { APIInteraction, InteractionResponseType } from 'discord-api-types/v9';

import { StatsCommand } from '../interactions';
import type { ArgumentsOf } from '../util/ArgumentsOf';
import type { ICommand, RespondFunction } from '../util/Command';
import { getUserByDiscordId } from '../util/getUserByDiscordId';
import { createEmbed, notLinkedEmbed } from '../util/embed';
import { container } from 'tsyringe';
import { Api, Range } from '@statsfm/statsfm.js';
import { getUserFromInteraction } from '../util/getUserFromInteraction';
import { URLs } from '../util/URLs';

const statsfmApi = container.resolve(Api);

export default class implements ICommand {
  commandObject = StatsCommand;

  guilds = ['901602034443227166'];

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof StatsCommand>,
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

    const stats = await statsfmApi.users.stats(data.userId, {
      range: Range.WEEKS,
    });

    await respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          createEmbed(interactionUser)
            .setAuthor({
              name: `${targetUser.username}'s stats past 4 weeks`,
              url: URLs.ProfileUrl(data.userId),
            })
            .addFields([
              {
                name: `Streams`,
                value: `${stats.count ?? 0}`,
                inline: true,
              },
              {
                name: `Minutes streamed`,
                value: `${Math.round(
                  (stats.durationMs ?? 0) / 1000 / 60
                )} minutes`,
                inline: true,
              },
              {
                name: `Hours streamed`,
                value: `${Math.round(
                  (stats.durationMs ?? 0) / 1000 / 60 / 60
                )} hours`,
                inline: true,
              },
              {
                name: `Different tracks`,
                value: `${stats.cardinality.tracks ?? 0} tracks`,
                inline: true,
              },
              {
                name: `Different artists`,
                value: `${stats.cardinality.artists ?? 0} artists`,
                inline: true,
              },
              {
                name: `Different albums`,
                value: `${stats.cardinality.albums ?? 0} albums`,
                inline: true,
              },
            ])
            .toJSON(),
        ],
      },
    });
  }
}
