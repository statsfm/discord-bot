import { ApplicationCommandOptionType } from 'discord.js';
import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType
} from '../../util/SlashCommandUtils';

export const AlbumInfoCommand = {
  name: 'album-info',
  description: 'Get info about an album. If Discord is linked with stats.fm, enjoy more info!',
  options: {
    album: {
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
      required: true,
      description:
        'The album you want to get info about, you can use to use names and stats.fm links'
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
