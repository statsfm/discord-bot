import { ApplicationCommandOptionType } from 'discord.js';
import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType
} from '../../util/SlashCommandUtils';

export const RecentlyStreamedCommand = {
  name: 'recently-played',
  description: 'Shows the recently played tracks of a given user',
  options: {
    user: {
      description: 'User',
      type: ApplicationCommandOptionType.User
    }
  },
  contexts: [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel
  ],
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  ]
} as const satisfies CommandPayload;
