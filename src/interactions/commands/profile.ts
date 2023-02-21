import { ApplicationCommandOptionType } from 'discord.js';

export const ProfileCommand = {
  name: 'profile',
  description: 'Show a user profile',
  options: {
    user: {
      description: 'User',
      type: ApplicationCommandOptionType.User,
    },
  },
} as const;
