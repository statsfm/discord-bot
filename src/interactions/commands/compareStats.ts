import { ApplicationCommandOptionType } from 'discord.js';

export const CompareStatsCommand = {
  name: 'compare-stats',
  description: 'Compare your stats against another users stats.',
  options: [
    {
      name: 'self',
      description: 'Compare your own stats against another users.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'user',
          description: "The user you'd like to compare your stats against.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: 'range',
          description: "The range of stats you'd like to compare against.",
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
    },
    {
      name: 'other',
      description: 'Compare two users stats against each other.',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'usera',
          description: "The 1st user you'd like to compare stats against.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: 'userb',
          description: "The 2nd user you'd like to compare stats against.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: 'range',
          description: "The range of stats you'd like to compare against.",
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
    },
  ],
} as const;
