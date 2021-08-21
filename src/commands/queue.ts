import axios from 'axios';
import { EmbedField, MessageOptions, SlashCommand, SlashCreator } from 'slash-create';
import { config } from '../util/config';

export class QueueCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'queue',
      description: 'Check the lengths of the import queues',
      guildIDs: config.discord.guildId
    });
  }

  async run(): Promise<string | MessageOptions | void> {
    type Type = {
      aggregations: {
        // eslint-disable-next-line camelcase
        total_streams: {
          value: number;
        };
        queue: {
          buckets: {
            key: number;
            // eslint-disable-next-line camelcase
            doc_count: number;
          }[];
        };
      };
      _shards: {
        total: number;
        successful: number;
        skipped: number;
        failed: number;
      };
    };
    const res = await axios.get<Type>(`${config.api.StatsURL}/elastic/queue/agg`);
    const embedFields: EmbedField[] = [];

    res.data.aggregations.queue.buckets.forEach((server) => {
      const name = [
        'Ernie.spotistats.app',
        'Purk.spotistats.app',
        'Tommie.spotistats.app',
        'Aart.spotistats.app'
      ][server.key];

      embedFields.push({
        name,
        value: `${server.doc_count} files in queue`
      });
    });
    embedFields.push({
      name: 'Total streams in queue',
      value: `${res.data.aggregations.total_streams.value}`
    });

    return {
      embeds: [
        {
          title: '<:spotistats:814651268907401256> Spotistats Status',
          fields: embedFields,
          color: 0x1db954
        }
      ]
    };
  }
}
