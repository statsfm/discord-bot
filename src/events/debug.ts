import { container } from 'tsyringe';
import { kLogger } from '../util/tokens';
import { createEvent } from '../util/Event';
import type { Logger } from '../util/Logger';

const logger = container.resolve<Logger>(kLogger);

export default createEvent('debug')
  .setOn(async (info) => {
    if (process.env.NODE_ENV && process.env.NODE_ENV === 'development') {
      logger.debug(`${info}`);
    }
  })
  .build();
