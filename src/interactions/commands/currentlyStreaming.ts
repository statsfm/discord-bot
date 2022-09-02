import { ApplicationCommandOptionType } from 'discord.js';

export const CurrentlyStreamingCommand = {
  name: 'currently-playing',
  description: 'Shows the track a user is currently playing',
  options: [
    {
      name: 'show-stats',
      description: 'Show the stats of the track that you are currently playing',
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: 'user',
      description:
        'The user to show the currently playing track of if they are listening to a track',
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
