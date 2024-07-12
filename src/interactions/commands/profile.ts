import { ApplicationCommandOptionType } from 'discord.js';
import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType
} from '../../util/SlashCommandUtils';

export const ProfileCommand = {
  name: 'profile',
  description: 'Show a user profile',
  options: {
    user: {
      description: 'User',
      type: ApplicationCommandOptionType.User
    }
  },
  contexts: [InteractionContextType.Guild, InteractionContextType.PrivateChannel],
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  ]
} as const satisfies CommandPayload;
