import { ApplicationCommandOptionType } from 'discord.js';
import { rangeChoices } from '../utils';

export const CurrentlyStreamingCommand = {
  name: 'currently-playing',
  description: 'Shows the track a user is currently playing',
  options: {
    'show-stats': {
      description: 'Show the stats of the track that you are currently playing',
      type: ApplicationCommandOptionType.Boolean,
    },
    user: {
      description:
        'The user to show the currently playing track of if they are listening to a track',
      type: ApplicationCommandOptionType.User,
    },
    range: {
      description: 'The range of stats to show',
      type: ApplicationCommandOptionType.String,
      choices: rangeChoices<false>(false),
    },
  },
} as const;
