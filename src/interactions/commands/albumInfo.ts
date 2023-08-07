import { ApplicationCommandOptionType } from 'discord.js';
import { CommandPayload } from '../../util/SlashCommandUtils';

export const AlbumInfoCommand = {
  name: 'album-info',
  description:
    'Get info about an album. If Discord is linked with stats.fm, enjoy more info!',
  options: {
    album: {
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
      required: true,
      description:
        'The album you want to get info about, you can use to use names and stats.fm links',
    },
  },
} as const satisfies CommandPayload;
