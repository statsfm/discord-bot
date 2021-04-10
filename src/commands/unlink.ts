import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';
import { MessageOptions } from 'slash-create/lib/context';
import { prisma } from '..';

export default class HelloCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'unlink',
      description: 'Unlink your Spotistats account.',
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
          'You do not have your Spotistats account linked, therefore you can not unlink it.',
        ephemeral: true,
      };
    await prisma.account.delete({ where: { id: account.id } });
    return {
      content: `Successfully unlinked your Spotistats account.`,
      ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: [],
      },
    };
  }
}
