import { CommandContext, SlashCommand, SlashCreator, MessageOptions } from 'slash-create';
import { config } from '../util/config';
import { prisma, client } from '..';

export default class UnlinkCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'unlink',
      description: 'Unlink your Spotistats account from your Discord account',
      guildIDs: config.discord.guildId
    });
  }

  async run(ctx: CommandContext): Promise<string | MessageOptions | void> {
    const account = await prisma.account.findUnique({
      where: { discordUserId: ctx.user.id }
    });
    if (!account) {
      return {
        content: "Can't find any Spotistats account linked to you :("
        // ephemeral: true,
      };
    }
    await prisma.account.delete({ where: { id: account.id } });

    const member = client.guilds.resolve(ctx.guildID).members.resolve(ctx.user.id);
    await member.roles.remove(config.discord.roles.plus);
    await member.roles.remove(config.discord.roles.beta);

    return {
      content: `Successfully unlinked your Spotistats account!`,
      // ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: []
      }
    };
  }
}
