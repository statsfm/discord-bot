import { ApplicationCommandOptionType } from 'discord.js';

export const ChartsCommand = {
  name: 'charts',
  description: 'Look at global top charts',
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'artists',
      description:
        'See the global top artists, supports customizable timeframes',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'range',
          description:
            'The range of which you want to see the global top artists of (defaults to Today)',
          choices: [
            {
              name: 'Today',
              value: 'today',
            },
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
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'tracks',
      description:
        'See the global top tracks, supports customizable timeframes',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'range',
          description:
            'The range of which you want to see the global top tracks of (defaults to Today)',
          choices: [
            {
              name: 'Today',
              value: 'today',
            },
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
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'albums',
      description:
        'See the global top albums, supports customizable timeframes',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'range',
          description:
            'The range of which you want to see the global top albums of (defaults to Today)',
          choices: [
            {
              name: 'Today',
              value: 'today',
            },
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
    },
  ],
} as const;
