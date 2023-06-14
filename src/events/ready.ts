import { container } from 'tsyringe';
import { kAnalytics, kLogger } from '../util/tokens';
import { createEvent } from '../util/Event';
import type { Logger } from '../util/Logger';
import { Analytics } from '../util/analytics';

const logger = container.resolve<Logger>(kLogger);
const analytics = container.resolve<Analytics>(kAnalytics);

export default createEvent('ready')
  .setOn(async () => {
    logger.info('Online!');

    await analytics.trackEvent('BOT_start');
  })
  .build();
