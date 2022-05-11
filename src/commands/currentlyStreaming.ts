import { APIInteraction, InteractionResponseType } from "discord-api-types/v9";

import { CurrentlyStreamingCommand } from "../interactions";
import type { ArgumentsOf } from "../util/ArgumentsOf";
import type { ICommand, RespondFunction } from "../util/Command";

import * as statsfm from "@statsfm/statsfm.js";
import getUserByDiscordId from "../util/GetUserByDiscordId";

export default class implements ICommand {
  commandObject = CurrentlyStreamingCommand;

  guilds = ["901602034443227166"];

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof CurrentlyStreamingCommand>,
    respond: RespondFunction
  ): Promise<void> {
    const targetUser = args.user?.user ?? interaction.member!.user;

    const api = new statsfm.Api();
    const { userId } = (await getUserByDiscordId(targetUser.id)) as {
      userId: string;
    };

    let currentlyPlaying;
    try {
      currentlyPlaying = await api.users.currentlyStreaming(userId);
    } catch (e) {}

    if (!currentlyPlaying) {
      await respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Nothing playing",
        },
      });
      return;
    }

    const stats = await api.users.trackStats(
      userId,
      currentlyPlaying.track.id,
      { range: statsfm.Range.WEEKS }
    );

    await respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            url: `https://stats.fm/track/${currentlyPlaying.track.id}`,
            color: 2021216,
            timestamp: new Date().toISOString(),
            footer: {
              icon_url: `https://cdn.discordapp.com/avatars/${interaction.member?.user.id}/${interaction.member?.user.avatar}.png`,
              text: `Issued by ${interaction.member?.user.username}#${interaction.member?.user.discriminator}`,
            },
            thumbnail: {
              url: currentlyPlaying.track.albums[0].image,
            },
            title: `${targetUser.username} is currently playing ${currentlyPlaying.track.name}`,
            // author: {
            //   name: `${targetUser.username} is currently playing ${currentlyPlaying.track.name}`,
            //   url: `https://stats.fm/${userId}`,
            //   // icon_url: `https://cdn.discordapp.com/avatars/${targetUser.id}/${targetUser.avatar}.png`,
            // },
            fields: [
              {
                name: "Artists",
                value: currentlyPlaying.track.artists
                  .map(
                    (artist) =>
                      `[${artist.name}](https://stats.fm/artist/${artist.id})`
                  )
                  .join(", "),
              },
              {
                name: "Albums",
                value:
                  currentlyPlaying.track.albums
                    .slice(0, 3)
                    .map(
                      (album) =>
                        `[${album.name}](https://stats.fm/album/${album.id})`
                    )
                    .join(", ") +
                  (currentlyPlaying.track.albums.length > 3
                    ? ` + [${
                        currentlyPlaying.track.albums.length - 3
                      } more](https://stats.fm/track/${
                        currentlyPlaying.track.id
                      })`
                    : ""),
              },
              {
                name: "Streams (past 4 weeks)",
                value: `${stats.count}x`,
                inline: true,
              },
              {
                name: "Minutes streamed (past 4 weeks)",
                value: `${Math.round(stats.durationMs / 1000 / 60)}min`,
                inline: true,
              },
            ],
          },
        ],
      },
    });
  }
}
