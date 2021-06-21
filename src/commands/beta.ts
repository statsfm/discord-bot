import {
  CommandContext,
  CommandOptionType,
  SlashCommand,
  SlashCreator,
  MessageOptions
} from 'slash-create';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { client, prisma } from '..';
import { config } from '../util/config';

export default class BetaCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'beta',
      description: 'Check if you are eligible for the beta role.',
      guildIDs: config.discord.guildId,
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'code',
          description: 'The import code shown in the mobile app.',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext): Promise<string | MessageOptions | void> {
    const account = await prisma.account.findUnique({
      where: { discordUserId: ctx.user.id }
    });

    if (!account) {
      return {
        content: 'Please link your Spotistats account first with `/link`.'
        // ephemeral: true,
      };
    }

    const code = (ctx.options.code as string).toUpperCase();
    const res = await fetch(`https://beta-api.spotistats.app/api/v1/import/code`, {
      method: 'POST',
      body: new URLSearchParams(`code=${code}`),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (!res.ok) {
      return {
        content: "Invalid code :( Are you sure you're using the beta version of the app?"
        // ephemeral: true,
      };
    }

    const data = await res.json();
    if (data.data.id !== account.spotistatsUserId) {
      return {
        content: 'The code you provided is not linked to your linked Spotistats account'
        // ephemeral: true,
      };
    }

    const member = client.guilds.resolve(ctx.guildID).members.resolve(ctx.user.id);
    await member.roles.add(config.discord.roles.beta);

    if (!account) {
      await prisma.account.create({
        data: { discordUserId: ctx.user.id, spotistatsUserId: data.data.id }
      });
    }

    return {
      content: `Added the <@&${config.discord.roles.beta}> role :)`,
      // ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: []
      }
    };
  }
}
