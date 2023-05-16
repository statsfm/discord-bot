import { ApplicationCommandOptionType } from 'discord.js';

export const TrackInfoCommand = {
  name: 'track-info',
  description: 'Get info about an track. If Discord is linked with stats.fm, enjoy more info!',
  options: {
    track: {
      type: ApplicationCommandOptionType.String,
      autocomplete: true,
      required: true,
      description: 'The track you want to get info about, you can use to use names and stats.fm links',
    },
  }
} as const;
