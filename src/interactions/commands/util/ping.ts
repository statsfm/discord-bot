import { ApplicationCommandOptionType } from 'discord.js';
import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType
} from '../../../util/SlashCommandUtils';

export const PingCommand = {
  name: 'ping',
  description: 'Health check',
  options: {
    hide: {
      type: ApplicationCommandOptionType.Boolean,
      description: 'Hides the output'
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
