import { ApplicationCommandOptionType } from 'discord.js';
import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType
} from '../../util/SlashCommandUtils';

export const ArtistInfoCommand = {
  name: 'artist-info',
  description: 'Get info about an artist. If Discord is linked with stats.fm, enjoy more info!',
  options: {
    artist: {
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
      required: true,
      description:
        'The artist you want to get info about, you can use to use names and stats.fm links'
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
