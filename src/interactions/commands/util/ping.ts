import { ApplicationCommandOptionType } from 'discord.js';

export const PingCommand = {
  name: 'ping',
  description: 'Health check',
  options: {
    hide: {
      type: ApplicationCommandOptionType.Boolean,
      description: 'Hides the output',
    },
  },
} as const;
