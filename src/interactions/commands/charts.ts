import { ApplicationCommandOptionType } from 'discord.js';
import {
  CommandPayload,
  StringChoiceOption,
} from '../../util/SlashCommandUtils';
import { rangeChoices } from '../utils';

function createRangeOptionForCharts<T extends string>(type: T) {
  return {
    type: ApplicationCommandOptionType.String,
    description: `The range of which you want to see the global top ${type} of (defaults to Today)`,
    choices: rangeChoices<true>(true),
  } as const satisfies StringChoiceOption<false>;
}

export const ChartsCommand = {
  name: 'charts',
  description: 'Look at global top charts',
  options: {
    artists: {
      type: ApplicationCommandOptionType.Subcommand,
      description:
        'See the global top artists, supports customizable timeframes',
      options: {
        range: createRangeOptionForCharts('artists'),
      },
    },
    tracks: {
      type: ApplicationCommandOptionType.Subcommand,
      description:
        'See the global top tracks, supports customizable timeframes',
      options: {
        range: createRangeOptionForCharts('tracks'),
      },
    },
    albums: {
      type: ApplicationCommandOptionType.Subcommand,
      description:
        'See the global top albums, supports customizable timeframes',
      options: {
        range: createRangeOptionForCharts('albums'),
      },
    },
  },
} as const satisfies CommandPayload;
