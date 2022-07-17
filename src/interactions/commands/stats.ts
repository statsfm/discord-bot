import { ApplicationCommandOptionType } from 'discord-api-types/v9';

export const StatsCommand = {
  name: 'stats',
  description: 'Shows some stats from a given user in the given timeframe',
  options: [
    {
      name: 'user',
      description: 'User',
      type: ApplicationCommandOptionType.User,
    },

    {
      name: 'range',
      description: 'The range of stats to show',
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: '4 weeks',
          value: '4-weeks',
        },
        {
          name: '6 months',
          value: '6-months',
        },
        {
          name: 'Lifetime',
          value: 'lifetime',
        },
      ],
    },
  ],
} as const;
