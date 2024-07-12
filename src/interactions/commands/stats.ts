import { ApplicationCommandOptionType } from 'discord.js';
import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType
} from '../../util/SlashCommandUtils';
import { rangeChoices } from '../utils';

export const StatsCommand = {
  name: 'stats',
  description: 'Shows some stats from a given user in the given timeframe',
  options: {
    user: {
      type: ApplicationCommandOptionType.User,
      description: 'User'
    },
    range: {
      type: ApplicationCommandOptionType.String,
      description: 'The range of stats to show',
      choices: rangeChoices(false)
    }
  },
  contexts: [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel
  ],
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  ]
} as const satisfies CommandPayload;
