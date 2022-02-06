import axios from 'axios';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import {
  CommandContext,
  CommandOptionType,
  MessageOptions,
  SlashCommand,
  SlashCreator
} from 'slash-create';
import { prisma } from '..';
import { config } from '../util/config';

dayjs.extend(duration);

export default class BetaCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'top-tracks',
      description: 'View someones top tracks',
      guildIDs: config.discord.guildId,
      options: [
        {
          type: CommandOptionType.USER,
          name: 'user',
          description: 'The user to check',
          required: false
        },
        {
          type: CommandOptionType.STRING,
          name: 'range',
          description: 'Range (weeks, months or lifetime)',
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

    const range = ctx.options?.user?.toString() ?? 'weeks';

    const res = await axios.get(
      `https://aart.backtrack.dev/api/v1/users/${account.spotistatsUserId}/top/tracks?range=${range}`
    );
    const { items } = res.data;

    return {
      content: items
        .map(
          (item) =>
            `${item.position}. ${item.track.name} (${item.streams ?? '?'} streams, ${
              item.playedMs > 0
                ? dayjs
                    .duration({ milliseconds: item.playedMs })
                    .add({ milliseconds: 0 })
                    .format('HH:mm')
                : '?'
            } streamed)`
        )
        .slice(0, 10)
        .join('\n'),
      // ephemeral: true,
      allowedMentions: {
        everyone: false,
        roles: []
      }
    };
  }
}
