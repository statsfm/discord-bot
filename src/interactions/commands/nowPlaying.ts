import { ApplicationCommandOptionType } from 'discord.js';

export const NowPlayingCommand = {
  name: 'now-playing',
  description: 'Minimal version of the currently playing command',
  options: {
    user: {
      description:
        'The user to show the currently playing track of if they are listening to a track',
      type: ApplicationCommandOptionType.User,
    },
    'show-stats': {
      description:
        'Show the stats of the track that you are currently playing, defaults to false',
      type: ApplicationCommandOptionType.Boolean,
    },
  },
} as const;
