import { ApplicationCommandOptionType } from 'discord.js';
import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType,
} from '../../util/SlashCommandUtils';

export const SearchCommand = {
  name: 'search',
  description: 'Search for albums, artists and tracks',
  options: {
    artists: {
      type: ApplicationCommandOptionType.Subcommand,
      description: 'Search for artists',
      options: {
        query: {
          type: ApplicationCommandOptionType.String,
          description: 'The query to search for, supports stats.fm links',
          required: true,
          autocomplete: true,
        },
      },
    },
    tracks: {
      type: ApplicationCommandOptionType.Subcommand,
      description: 'Search for tracks',
      options: {
        query: {
          type: ApplicationCommandOptionType.String,
          description: 'The query to search for, supports stats.fm links',
          required: true,
          autocomplete: true,
        },
      },
    },
    albums: {
      type: ApplicationCommandOptionType.Subcommand,
      description: 'Search for albums',
      options: {
        query: {
          type: ApplicationCommandOptionType.String,
          description: 'The query to search for, supports stats.fm links',
          required: true,
          autocomplete: true,
        },
      },
    },
  },
  contexts: [
    InteractionContextType.Guild,
    InteractionContextType.BotDM,
    InteractionContextType.PrivateChannel,
  ],
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall,
  ],
} as const satisfies CommandPayload;
