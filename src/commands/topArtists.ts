import { APIInteraction, InteractionResponseType } from "discord-api-types/v9";

import { TopArtistsCommand } from "../interactions";
import type { ArgumentsOf } from "../util/ArgumentsOf";
import type { ICommand, RespondFunction } from "../util/Command";

import * as statsfm from "@statsfm/statsfm.js";
import getUserByDiscordId from "../util/GetUserByDiscordId";

export default class implements ICommand {
  commandObject = TopArtistsCommand;

  guilds = ["901602034443227166"];

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof TopArtistsCommand>,
    respond: RespondFunction
  ): Promise<void> {
    const targetUser = args.user?.user ?? interaction.member!.user;

    const api = new statsfm.Api();
    const { userId } = (await getUserByDiscordId(targetUser.id)) as {
      userId: string;
    };

    const topArtists = await api.users.topArtists(userId, {
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
            //   name: `${targetUser.username}'s top artists past 4 weeks`,
            //   url: `https://stats.fm/${userId}`,
            //   // icon_url: `https://cdn.discordapp.com/avatars/${targetUser.id}/${targetUser.avatar}.png`,
            // },
            title: `${targetUser.username}'s top artists past 4 weeks`,
            description: topArtists
              .slice(0, 15)
              .map(
                (topArtist) =>
                  `${topArtist.position}. [${
                    topArtist.artist.name
                  }](https://stats.fm/artist/${topArtist.artist.id}) - ${
                    topArtist.streams ?? 0
                  } streams • ${Math.round(
                    (topArtist.playedMs ?? 0) / 1000 / 60
                  )} min`
              )
              .join("\n"),
            // fields: topArtists.slice(0, 12).map((topArtist) => {
            //   return {
            //     name: `${topArtist.position}. ${topArtist.artist.name}`,
            //     // value: `[${topArtist.streams ?? 0} streams • ${Math.round(
            //     //   (topArtist.playedMs ?? 0) / 1000 / 60
            //     // )} min](https://stats.fm/artist/${topArtist.artist.id})`,
            //     value: `${topArtist.streams ?? 0} streams • ${Math.round(
            //       (topArtist.playedMs ?? 0) / 1000 / 60
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
