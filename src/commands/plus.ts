import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import fetch from 'node-fetch';
import { MessageOptions } from 'slash-create/lib/context';
import { client, prisma } from '..';

export default class HelloCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'plus',
      description: 'Check if you are eligible for the plus role.',
      guildIDs: '763775648819970068',
    });
    this.filePath = __filename;
  }

  async run(ctx: CommandContext): Promise<string | MessageOptions | void> {
    const account = await prisma.account.findFirst({
      where: { discordUserId: ctx.user.id },
    });
    if (!account)
      return {
        content:
          'You do not have your Spotistats account linked. Please link it with the `/link` command.',
        ephemeral: true,
      };
    const isPlusCheck = await fetch(
      `https://api.spotistats.app/api/v1/plus/status/${account.spotifyUserId}`,
      {
        headers: {
          Authorization: process.env.AUTH_TOKEN,
        },
      }
    );
    const { data } = await isPlusCheck.json();
    if (data.isPlus === false)
      return {
        content:
          'You are not eligible for the <@&${process.env.PLUS_ROLE}> role.',
        ephemeral: true,
        allowedMentions: {
          everyone: false,
          roles: [],
        },
      };
    const member = client.guilds
      .resolve(ctx.guildID)
      .members.resolve(ctx.user.id);
    await member.roles.add(process.env.PLUS_ROLE);
    return {
      content: `You have received the <@&${process.env.PLUS_ROLE}> role.`,
      ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: [],
      },
    };
  }
}
