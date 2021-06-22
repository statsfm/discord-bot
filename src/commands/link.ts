import {
  CommandContext,
  CommandOptionType,
  SlashCommand,
  SlashCreator,
  MessageOptions
} from 'slash-create';
import { client, prisma, spotistats, spotistatsBeta } from '..';
import { config } from '../util/config';

export default class LinkCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'link',
      description: 'Link your Spotistats account with Discord and gain access to special roles',
      guildIDs: config.discord.guildId,
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'code',
          description: 'The import code shown on the import settings in the Spotistats app',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext): Promise<string | MessageOptions | void> {
    try {
      let account = await prisma.account.findUnique({
        where: { discordUserId: ctx.user.id }
      });

      if (account) {
        return {
          content:
            'You already have an Spotistats account linked, please unlink it first with `/unlink`'
          // ephemeral: true,
        };
      }

      const code = (ctx.options.code as string).toUpperCase();
      if (code.length !== 6) {
        return 'Invalid import code :(';
      }

      let isBeta = false;
      let hasPlusInBeta = false;
      let res = await spotistats.getUserDataFromCode(code);
      if (!res.status) {
        res = await spotistatsBeta.getUserDataFromCode(code);

        if (!res.status || !res.data) {
          return { content: 'Invalid import code :(' }; // ephemeral: true
        }

        isBeta = true;
        hasPlusInBeta = res.data.isPlus;

        res = await spotistats.getUserDataFromId(res.data.id);
      }

      account = await prisma.account.findUnique({
        where: { spotistatsUserId: res.data.id }
      });
      if (account) {
        return {
          content: `${res.data.displayName}'s Spotistats account has already been linked to <@!${account.discordUserId}>. Ask <@!${account.discordUserId}> to unlink it with \`/unlink\`.`,
          allowedMentions: { everyone: false, users: [] }
          // ephemeral: true,
        };
      }

      const content = [
        `Successfully linked your Spotistats account (${res.data.displayName}) to your Discord account!`
      ];
      if (res.data.isPlus) {
        const member = client.guilds.resolve(ctx.guildID).members.resolve(ctx.user.id);
        await member.roles.add(config.discord.roles.plus);
        content.push(`Added the <@&${config.discord.roles.plus}> role :)`);
      } else if (hasPlusInBeta) {
        content.push(
          `It looks like you only have Plus in the beta app, so you haven't received the <@&${config.discord.roles.plus}> role :(`
        );
      }
      if (isBeta) {
        const member = client.guilds.resolve(ctx.guildID).members.resolve(ctx.user.id);
        await member.roles.add(config.discord.roles.beta);
        content.push(
          `Added the <@&${config.discord.roles.beta}> role, thanks for being a beta tester!`
        );
      }

      await prisma.account.create({
        data: { discordUserId: ctx.user.id, spotistatsUserId: res.data.id }
      });

      return {
        content: content.join('\n'),
        // ephemeral: true,
        allowedMentions: {
          everyone: false,
          roles: []
        }
      };
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
