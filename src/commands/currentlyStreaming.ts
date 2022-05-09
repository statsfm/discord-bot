import { APIInteraction, InteractionResponseType } from 'discord-api-types/v9';

import { CurrentlyStreamingCommand } from '../interactions';
import type { ArgumentsOf } from '../util/ArgumentsOf';
import type { ICommand, RespondFunction } from '../util/Command';

import * as statsfm from '@statsfm/statsfm.js';
import getUserByDiscordId from '../util/GetUserByDiscordId';

export default class implements ICommand {
  commandObject = CurrentlyStreamingCommand;

  guilds = ['901602034443227166'];

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof CurrentlyStreamingCommand>,
    respond: RespondFunction
  ): Promise<void> {
    console.log(args);
    const api = new statsfm.Api();
    const { userId } = (await getUserByDiscordId(
      args.user?.user?.id ?? interaction.member!.user.id
    )) as { userId: string };
    console.log({ userId });
    const currentlyPlaying = await api.users.currentlyStreaming(userId);

    console.log({ currentlyPlaying });

    if (!currentlyPlaying) {
      await respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: 'Nothing playing',
        },
      });
      return;
    }

    await respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            // description: user.profile?.bio,
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
            author: {
              name: currentlyPlaying.track.name,
              url: `https://stats.fm/${userId}`,
            },
            fields: [
              {
                name: 'Artists',
                value: currentlyPlaying.track.artists
                  .map((artist) => artist.name)
                  .join(', '),
              },
              {
                name: 'Albums',
                value: currentlyPlaying.track.albums
                  .map((album) => album.name)
                  .join(', '),
              },
            ],
          },
        ],
      },
    });
  }
}
