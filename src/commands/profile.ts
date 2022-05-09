import { APIInteraction, InteractionResponseType } from "discord-api-types/v9";

import { ProfileCommand } from "../interactions";
import type { ArgumentsOf } from "../util/ArgumentsOf";
import type { ICommand, RespondFunction } from "../util/Command";

import * as statsfm from "@statsfm/statsfm.js";
import getUserByDiscordId from "../util/GetUserByDiscordId";

export default class implements ICommand {
  commandObject = ProfileCommand;

  guilds = ["901602034443227166"];

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof ProfileCommand>,
    respond: RespondFunction
  ): Promise<void> {
    const api = new statsfm.Api();
    const { userId } = await getUserByDiscordId(
      args.user?.user?.id ?? interaction.member!.user.id
    );
    const user: statsfm.UserPublic = await api.users.get(userId);

    await respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            // description: user.profile?.bio,
            url: `https://stats.fm/${user.customId ?? user.id}`,
            color: 2021216,
            timestamp: new Date().toISOString(),

            footer: {
              icon_url: `https://cdn.discordapp.com/avatars/${interaction.member?.user.id}/${interaction.member?.user.avatar}.png`,
              text: `Issued by ${interaction.member?.user.username}#${interaction.member?.user.discriminator}`,
            },
            thumbnail: {
              url: user.image,
            },
            author: {
              name: user.displayName,
              url: `https://stats.fm/${user.customId ?? user.id}`,
            },
            fields: [
              {
                name: "Pronouns",
                value: user.profile?.pronouns ?? "Unknown",
              },
              {
                name: "Bio",
                value: user.profile?.bio ?? "*No bio*",
              },
            ],
          },
        ],
      },
    });
  }
}
