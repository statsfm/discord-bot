import { ApplicationCommandOptionType } from 'discord.js';
import { CommandPayload } from '../../util/SlashCommandUtils';

export const ProfileCommand = {
  name: 'profile',
  description: 'Show a user profile',
  options: {
    user: {
      description: 'User',
      type: ApplicationCommandOptionType.User,
    },
  },
} as const satisfies CommandPayload;
