import { APIInteraction, InteractionResponseType } from "discord-api-types/v9";

import { RecentlyStreamedCommand } from "../interactions";
import type { ArgumentsOf } from "../util/ArgumentsOf";
import type { ICommand, RespondFunction } from "../util/Command";

import * as statsfm from "@statsfm/statsfm.js";
import getUserByDiscordId from "../util/GetUserByDiscordId";

export default class implements ICommand {
  commandObject = RecentlyStreamedCommand;

  guilds = ["901602034443227166"];

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof RecentlyStreamedCommand>,
    respond: RespondFunction
  ): Promise<void> {
    const targetUser = args.user?.user ?? interaction.member!.user;

    const api = new statsfm.Api();
    const { userId } = (await getUserByDiscordId(targetUser.id)) as {
      userId: string;
    };

    const recentlyStreamed = await api.users.recentlyStreamed(userId);

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
            // author: {
            //   name: `${targetUser.username}'s top artists past 4 weeks`,
            //   url: `https://stats.fm/${userId}`,
            //   // icon_url: `https://cdn.discordapp.com/avatars/${targetUser.id}/${targetUser.avatar}.png`,
            // },
            title: `${targetUser.username}'s recently played tracks`,
            description: recentlyStreamed
              .slice(0, 15)
              .map(
                (recentlyStreamedTrack) =>
                  `- [${
                    recentlyStreamedTrack.track.name
                  }](https://stats.fm/track/${
                    recentlyStreamedTrack.track.id
                  }) by ${recentlyStreamedTrack.track.artists
                    .map(
                      (artist) =>
                        `[${artist.name}](https://stats.fm/artist/${artist.id})`
                    )
                    .join(", ")} (${Math.round(
                    (Date.now() -
                      new Date(recentlyStreamedTrack.endTime).getTime()) /
                      1000 /
                      60
                  )}min ago)`
              )
              .join("\n"),
          },
        ],
      },
    });
  }
}
