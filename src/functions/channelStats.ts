import Api, { TotalSizeData, TotalSizeItem } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { setTimeout as sleep } from 'node:timers/promises';
import { Config } from '../util/Config';
import {
  ChannelType,
  RESTGetAPIChannelResult,
  RESTPatchAPIChannelJSONBody,
  RESTPatchAPIChannelResult,
  Routes,
  Snowflake,
} from 'discord-api-types/v9';
import { kRest } from '../util/tokens';
import type { Rest } from '@cordis/rest';

function getSimulatedCount(
  current: TotalSizeData,
  previous: TotalSizeData
): number {
  let { count } = current;
  const timeDiff =
    new Date(current.date).getTime() - new Date(previous.date).getTime();
  const epochOffset = Date.now() - new Date(current.date).getTime();
  const diffBetweenCurrentAndPreviousSnapshot = current.count - previous.count;
  const diffPerUnit = diffBetweenCurrentAndPreviousSnapshot / timeDiff;
  count += epochOffset * diffPerUnit;
  return count;
}

export async function runChannelStatsUpdate() {
  const api = container.resolve(Api);
  const config = container.resolve(Config);
  const rest = container.resolve<Rest>(kRest);
  const stats = await api.stats.databaseSize();
  const mappedStats = Object.keys(stats).map((key) => ({
    key,
    channelId: (config.statisticChannels as Record<string, Snowflake>)[key],
    name: key
      .split(/(?=[A-Z])/)
      .join(' ')
      .replace(
        /\w\S*/,
        (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      ),
    count: Math.round(
      getSimulatedCount(
        ((stats as any)[key] as TotalSizeItem).current,
        ((stats as any)[key] as TotalSizeItem).previous
      )
    ).toLocaleString('en-US'),
  }));

  for await (const stat of mappedStats) {
    const channel = await rest.get<RESTGetAPIChannelResult>(
      Routes.channel(stat.channelId)
    );
    if (!channel) continue;
    if (channel.type !== ChannelType.GuildVoice) continue;
    await rest.patch<RESTPatchAPIChannelResult, RESTPatchAPIChannelJSONBody>(
      Routes.channel(stat.channelId),
      {
        data: {
          name: `${stat.name}: ${stat.count}`,
        },
      }
    );
    await sleep(7_500);
  }
}
