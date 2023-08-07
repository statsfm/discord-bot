import { ApplicationCommandOptionType } from 'discord.js';
import { CommandPayload } from '../../../util/SlashCommandUtils';

export const PingCommand = {
  name: 'ping',
  description: 'Health check',
  options: {
    hide: {
      type: ApplicationCommandOptionType.Boolean,
      description: 'Hides the output',
    },
  },
} as const satisfies CommandPayload;
