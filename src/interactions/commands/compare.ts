import { ApplicationCommandOptionType } from 'discord.js';
import {
  CommandPayload,
  StringChoiceOption,
} from '../../util/SlashCommandUtils';
import { rangeChoices } from '../utils';

const compareRange = {
  type: ApplicationCommandOptionType.String,
  description: "The range of stats you'd like to compare against.",
  choices: rangeChoices<false>(false),
} as const satisfies StringChoiceOption<false>;

export const CompareStatsCommand = {
  name: 'compare-stats',
  description: 'Compare your stats against another users stats.',
  options: {
    self: {
      type: ApplicationCommandOptionType.Subcommand,
      description: 'Compare your own stats against another users.',
      options: {
        user: {
          type: ApplicationCommandOptionType.User,
          description: "The user you'd like to compare your stats against.",
          required: true,
        },
        range: compareRange,
      },
    },
    other: {
      type: ApplicationCommandOptionType.Subcommand,
      description: 'Compare two users stats against each other.',
      options: {
        'user-one': {
          type: ApplicationCommandOptionType.User,
          description: "The first user you'd like to compare stats against.",
          required: true,
        },
        'user-two': {
          type: ApplicationCommandOptionType.User,
          description: "The second user you'd like to compare stats against.",
          required: true,
        },
        range: compareRange,
      },
    },
  },
} as const satisfies CommandPayload;
