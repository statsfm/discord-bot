import { APIInteraction, InteractionResponseType } from "discord-api-types/v9";

import { TopAlbumsCommand } from "../interactions";
import type { ArgumentsOf } from "../util/ArgumentsOf";
import type { ICommand, RespondFunction } from "../util/Command";

import * as statsfm from "@statsfm/statsfm.js";
import getUserByDiscordId from "../util/GetUserByDiscordId";

export default class implements ICommand {
  commandObject = TopAlbumsCommand;

  guilds = ["901602034443227166"];

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof TopAlbumsCommand>,
    respond: RespondFunction
  ): Promise<void> {
    const targetUser = args.user?.user ?? interaction.member!.user;

    const api = new statsfm.Api();
    const { userId } = (await getUserByDiscordId(targetUser.id)) as {
      userId: string;
    };

    const topAlbums = await api.users.topAlbums(userId, {
      range: statsfm.Range.WEEKS,
    });

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
            //   name: `${targetUser.username}'s top albums past 4 weeks`,
            //   url: `https://stats.fm/${userId}`,
            //   // icon_url: `https://cdn.discordapp.com/avatars/${targetUser.id}/${targetUser.avatar}.png`,
            // },
            title: `${targetUser.username}'s top albums past 4 weeks`,
            description: topAlbums
              .slice(0, 15)
              .map(
                (topAlbum) =>
                  `${topAlbum.position}. [${
                    topAlbum.album.name
                  }](https://stats.fm/album/${topAlbum.album.id}) - ${
                    topAlbum.streams ?? 0
                  } streams • ${Math.round(
                    (topAlbum.playedMs ?? 0) / 1000 / 60
                  )} min`
              )
              .join("\n"),
            // fields: topAlbums.slice(0, 12).map((topAlbum) => {
            //   return {
            //     name: `${topAlbum.position}. ${topAlbum.album.name}`,
            //     // value: `[${topAlbum.streams ?? 0} streams • ${Math.round(
            //     //   (topAlbum.playedMs ?? 0) / 1000 / 60
            //     // )} min](https://stats.fm/album/${topAlbum.album.id})`,
            //     value: `${topAlbum.streams ?? 0} streams • ${Math.round(
            //       (topAlbum.playedMs ?? 0) / 1000 / 60
            //     )} min`,
            //     // inline: true,
            //   };
            // }),
          },
        ],
      },
    });
  }
}
