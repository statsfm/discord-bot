import { ApplicationCommandOptionType } from 'discord.js';

export const RecentlyStreamedCommand = {
  name: 'recently-played',
  description: 'Shows the recently played tracks of a given user',
  options: {
    user: {
      description: 'User',
      type: ApplicationCommandOptionType.User,
    },
  },
} as const;
