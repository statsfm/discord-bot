import { EmbedField, MessageOptions, SlashCommand, SlashCreator } from 'slash-create';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { statusApi } from '..';
import { config } from '../util/config';

dayjs.extend(relativeTime);

enum Color {
  RED = 0xff2600,
  GREEN = 0x1db954,
  ORANGE = 0xff9300
}

export class StatusCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'status',
      description: 'Check the status of the Spotistats servers',
      guildIDs: config.discord.guildId
    });
  }

  async run(): Promise<string | MessageOptions | void> {
    const status = await statusApi.getStatus();
    const colors = [];
    const embedFields: EmbedField[] = [];

    status.data.forEach((v) => {
      let emote: string;
      if (v.attributes.status !== 'up' && v.attributes.status !== 'paused') {
        colors.push(Color.RED);
        emote = ':red_circle:';
      } else if (v.attributes.status === 'paused') {
        colors.push(Color.ORANGE);
        emote = ':orange_circle:';
      } else {
        colors.push(Color.GREEN);
        emote = ':green_circle:';
      }
      embedFields.push({
        name: v.attributes.url,
        value: `${emote} **${v.attributes.status}** (Last checked: ${dayjs(
          new Date(v.attributes.last_checked_at)
        ).fromNow()})`
      });
    });

    let color: number;
    if (colors.includes(Color.RED)) color = Color.RED;
    else if (colors.includes(Color.ORANGE)) color = Color.ORANGE;
    else if (colors.includes(Color.GREEN)) color = Color.GREEN;

    return {
      embeds: [
        {
          title: '<:spotistats:814651268907401256> Spotistats Status',
          fields: embedFields,
          color
        }
      ]
    };
  }
}
