import { APIInteraction, InteractionResponseType } from "discord-api-types/v9";

import { StatsCommand } from "../interactions";
import type { ArgumentsOf } from "../util/ArgumentsOf";
import type { ICommand, RespondFunction } from "../util/Command";

import * as statsfm from "@statsfm/statsfm.js";
import getUserByDiscordId from "../util/GetUserByDiscordId";

export default class implements ICommand {
  commandObject = StatsCommand;

  guilds = ["901602034443227166"];

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof StatsCommand>,
    respond: RespondFunction
  ): Promise<void> {
    const targetUser = args.user?.user ?? interaction.member!.user;

    const api = new statsfm.Api();
    const { userId } = (await getUserByDiscordId(targetUser.id)) as {
      userId: string;
    };

    const stats = await api.users.stats(userId, { range: statsfm.Range.WEEKS });

    await respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            url: `https://stats.fm/${userId}`,
            color: 2021216,
            timestamp: new Date().toISOString(),
            footer: {
              icon_url: `https://cdn.discordapp.com/avatars/${interaction.member?.user.id}/${interaction.member?.user.avatar}.png`,
              text: `Issued by ${interaction.member?.user.username}#${interaction.member?.user.discriminator}`,
            },
            thumbnail: {
              url: `https://cdn.discordapp.com/avatars/${targetUser.id}/${targetUser.avatar}.png`,
            },
            title: `${targetUser.username}'s stats past 4 weeks`,
            fields: [
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
            ],
          },
        ],
      },
    });
  }
}
