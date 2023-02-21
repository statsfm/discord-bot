import { ApplicationCommandOptionType } from 'discord.js';
import { rangeChoices } from '../utils';

export const StatsCommand = {
  name: 'stats',
  description: 'Shows some stats from a given user in the given timeframe',
  options: {
    user: {
      type: ApplicationCommandOptionType.User,
      description: 'User',
    },
    range: {
      type: ApplicationCommandOptionType.String,
      description: 'The range of stats to show',
      choices: rangeChoices<false>(false),
    },
  },
} as const;
