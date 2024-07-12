import { ApplicationCommandOptionType } from 'discord.js';
import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType
} from '../../util/SlashCommandUtils';

export const NowPlayingCommand = {
  name: 'now-playing',
  description: 'Show the currently playing track of a user',
  options: {
    user: {
      description:
        'The user to show the currently playing track of if they are listening to a track',
      type: ApplicationCommandOptionType.User
    }
  },
  contexts: [InteractionContextType.Guild, InteractionContextType.PrivateChannel],
  integration_types: [
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
  ]
} as const satisfies CommandPayload;
