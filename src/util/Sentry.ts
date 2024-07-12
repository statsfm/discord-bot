import { Logger } from './Logger';
import * as Sentry from '@sentry/node';
import type { Interaction } from 'discord.js';
import { Util } from './Util';

const logger = new Logger('Error logger');

export function reportError(error: any, interaction: Interaction) {
  if ('NODE_ENV' in process.env && process.env.NODE_ENV === 'production') {
    const interactionData = interaction.toJSON() as any;
    if ('options' in interaction) interactionData.options = interaction.options.data;
    return Sentry.captureException(error, {
      user: {
        id: interaction.user.id,
        username: Util.getDiscordUserTag(interaction.user)
      },
      extra: {
        interaction: interactionData
      }
    });
  }
  // If is object, log it as JSON
  logger.error('Error', error);
  return 'Not in production, so not reporting error to Sentry.';
}
