import Bree from 'bree';
import { container } from 'tsyringe';
import { Config } from './util/Config';
import type { Logger } from './util/Logger';
import { Util } from './util/Util';
import path from 'node:path';
import { kLogger } from './util/tokens';
import { JobMessage, JobType } from './util/Constants';
import { runChannelStatsUpdate } from './functions/channelStats';

export function registerJobs() {
  const bree = container.resolve(Bree);
  const config = container.resolve(Config);
  const logger = container.resolve<Logger>(kLogger);

  if (!Util.isNullOrUndefined(config.statisticChannels)) {
    logger.info('Registering job: channelStatistics');
    bree.add({
      name: 'channelStatistics',
      path: path.join(__dirname, 'jobs', 'channelStatistics.js'),
      cron: '*/30 * * * *',
    });
  }
}

export function startJobs() {
  const bree = container.resolve(Bree);

  bree.on('worker created', (name) => {
    bree.workers[name]?.on('message', async (message: JobMessage) => {
      if (message.op === JobType.CHANNEL_STATISTICS) {
        await runChannelStatsUpdate();
      }
    });
  });

  bree.on('worker deleted', (name) => {
    bree.workers[name]?.removeAllListeners();
  });

  bree.start();
}
