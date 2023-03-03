import { Logger } from './Logger';
import * as Sentry from '@sentry/node';
import type { Interaction } from 'discord.js';

const logger = new Logger('Error logger');

export function reportError(error: any, interaction: Interaction) {
  if ('NODE_ENV' in process.env && process.env.NODE_ENV === 'production') {
    return Sentry.captureException(error, {
      user: {
        id: interaction.user.id,
        username: interaction.user.tag,
      },
      extra: {
        interaction: interaction.toJSON(),
      },
    });
  }
  // If is object, log it as JSON
  if (typeof error === 'object') {
    logger.error(JSON.stringify(error, null, 2));
  } else {
    logger.error(error);
  }
  return 'Not in production, so not reporting error to Sentry.';
}
