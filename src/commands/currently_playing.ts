import axios from 'axios';
import {
  CommandContext,
  CommandOptionType,
  MessageOptions,
  SlashCommand,
  SlashCreator
} from 'slash-create';
import { prisma } from '..';
import { config } from '../util/config';

export default class BetaCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'currently-playing',
      description: 'View your currently playing song',
      guildIDs: config.discord.guildId,
      options: [
        {
          type: CommandOptionType.USER,
          name: 'user',
          description: 'The user to check',
          required: false
        }
      ]
    });
  }

  async run(ctx: CommandContext): Promise<string | MessageOptions | void> {
    const targetUserId = ctx.options?.user?.toString() ?? ctx.user.id;
    const account = await prisma.account.findUnique({
      where: { discordUserId: targetUserId }
    });

    if (!account) {
      return {
        content: 'Please link your Spotistats account first with `/link`.'
      };
    }

    const res = await axios.get(
      `https://aart.backtrack.dev/api/v1/users/${account.spotistatsUserId}/streams/current`
    );
    const { item } = res.data;

    return {
      content: `${item.track.name} by ${item.track.artists.map((a) => a.name).join(',')}`,
      // ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: []
      }
    };
  }
}
