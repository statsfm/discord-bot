import { CommandContext, SlashCommand, SlashCreator,MessageOptions } from 'slash-create';
import { prisma } from '..';

export default class HelloCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'unlink',
      description: 'Unlink your Spotistats account from your Discord account',
      guildIDs: '763775648819970068',
    });
    this.filePath = __filename;
  }

  async run(ctx: CommandContext): Promise<string | MessageOptions | void> {
    const account = await prisma.account.findUnique({
      where: { discordUserId: ctx.user.id },
    });
    if (!account) {
      return {
        content: "Can't find any Spotistats account linked to you :(",
        // ephemeral: true,
      };
    }
    await prisma.account.delete({ where: { id: account.id } });
    return {
      content: `Successfully unlinked your Spotistats account!`,
      // ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: [],
      },
    };
  }
}
