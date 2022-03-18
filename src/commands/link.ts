import { CommandContext, SlashCommand, SlashCreator, MessageOptions } from 'slash-create';
import StringCrypto from 'string-crypto';
import { prisma } from '..';
import { config } from '../util/config';

const cryptoGen = new StringCrypto({
  salt: process.env.SECRET_KEY,
  iterations: 10,
  digest: 'sha3-512'
});

export default class LinkCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'link',
      description: 'Link your Spotistats account with Discord and gain access to special roles',
      guildIDs: config.discord.guildId
    });
  }

  async run(ctx: CommandContext): Promise<string | MessageOptions | void> {
    const account = await prisma.account.findUnique({
      where: { discordUserId: ctx.user.id }
    });

    if (account) {
      return {
        content:
          'You already have an Spotistats account linked, please unlink it first with `/unlink`'
        // ephemeral: true,
      };
    }

    const link = `https://api.stats.fm/api/v1/auth/redirect/spotify?scope=user-read-private&redirect_uri=https://discord-bot.stats.fm/callback&state=${cryptoGen.encryptString(
      ctx.user.id,
      process.env.PASSWORD
    )}`;

    return {
      ephemeral: true,
      embeds: [
        {
          author: {
            name: 'Spotistats Account Linking'
          },
          description: `To be able to link your account, please click [here](${link}). After linking, to obtain your Spotistats Plus role, please use the command \`/plus\`.`
        }
      ]
    };
  }
}
