import {
  CommandContext,
  CommandOptionType,
  SlashCommand,
  SlashCreator,
} from 'slash-create';
import fetch from 'node-fetch';
import { MessageOptions } from 'slash-create/lib/context';
import { client, prisma } from '..';

export default class HelloCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'link',
      description: 'Link your Spotistats account with Discord.',
      guildIDs: '763775648819970068',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'code',
          description: 'The import code shown in the mobile app.',
          default: true,
          required: true,
        },
      ],
    });
    this.filePath = __filename;
  }

  async run(ctx: CommandContext): Promise<string | MessageOptions | void> {
    const account = await prisma.account.findFirst({
      where: { discordUserId: ctx.user.id },
    });
    if (account)
      return {
        content:
          'You already have an Spotistats account linked, please unlink it first.',
        ephemeral: true,
      };
    const code = (ctx.options.code as string).toUpperCase();
    let res = await fetch(`https://api.spotistats.app/api/v1/import/code`, {
      method: 'POST',
      body: new URLSearchParams(`code=${code}`),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (!res.ok) {
      res = await fetch(`https://beta-api.spotistats.app/api/v1/import/code`, {
        method: 'POST',
        body: new URLSearchParams(`code=${code}`),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    }
    const data = await res.json();
    if (!data.data) return { content: 'Import code invalid.', ephemeral: true };
    const isPlusCheck = await fetch(
      `https://api.spotistats.app/api/v1/plus/status/${data.data.id}`,
      {
        headers: {
          Authorization: process.env.AUTH_TOKEN,
        },
      }
    );
    const { data: plusData } = await isPlusCheck.json();
    const content = ['Thanks for linking your Spotistats account.'];
    if (plusData.isPlus === true) {
      const member = client.guilds
        .resolve(ctx.guildID)
        .members.resolve(ctx.user.id);
      await member.roles.add(process.env.PLUS_ROLE);
      content.push(`You have received the <@&${process.env.PLUS_ROLE}> role.`);
    }
    if (res.url === 'https://beta-api.spotistats.app/api/v1/import/code') {
      const member = client.guilds
        .resolve(ctx.guildID)
        .members.resolve(ctx.user.id);
      await member.roles.add(process.env.BETA_ROLE);
      content.push(`You have received the <@&${process.env.BETA_ROLE}> role.`);
    }
    await prisma.account.create({
      data: { discordUserId: ctx.user.id, spotifyUserId: data.data.id },
    });
    return {
      content: content.join('\n'),
      ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: [],
      },
    };
  }
}
