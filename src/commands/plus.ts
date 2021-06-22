import { CommandContext, SlashCommand, SlashCreator, MessageOptions } from 'slash-create';
import { client, prisma, spotistats } from '..';
import { config } from '../util/config';

export default class PlusCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'plus',
      description: 'Check if you are eligible for the plus role.',
      guildIDs: config.discord.guildId
    });
  }

  async run(ctx: CommandContext): Promise<string | MessageOptions | void> {
    const account = await prisma.account.findFirst({
      where: { discordUserId: ctx.user.id }
    });
    if (!account) {
      return {
        content: 'Please link your Spotistats account first with `/link`'
        // ephemeral: true,
      };
    }

    const res = await spotistats.getUserDataFromId(account.spotistatsUserId);

    if (!res.data.isPlus) {
      return {
        content: `It looks like your linked Spotistats account is not a Plus account :(\nps. having Plus in the beta doens't count ;)`,
        // ephemeral: true,
        allowedMentions: {
          everyone: false,
          roles: []
        }
      };
    }

    const member = client.guilds.resolve(ctx.guildID).members.resolve(ctx.user.id);
    await member.roles.add(config.discord.roles.plus);

    return {
      content: `Added the <@&${config.discord.roles.plus}> role :)`,
      // ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: []
      }
    };
  }
}
