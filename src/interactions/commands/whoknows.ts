import { ApplicationCommandOptionType } from 'discord.js';
import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType,
  StringAutocompleteOption,
  StringChoiceOption
} from '../../util/SlashCommandUtils';
import { rangeChoices } from '../utils';

function createRangeOptionForWhoKnows() {
  return {
    type: ApplicationCommandOptionType.String,
    description: `The range of which you want to see top listeners in this server of, defaults to lifetime`,
    choices: rangeChoices(true)
  } as const satisfies StringChoiceOption<false>;
}

function createTypeOptionForWhoKnows<T extends string>(type: T) {
  return {
    type: ApplicationCommandOptionType.String,
    description: `The ${type}s you want to see top listeners in this server of, defaults to currently playing`,
    autocomplete: true,
    required: false
  } as const satisfies StringAutocompleteOption<false>;
}

export const WhoKnowsCommand = {
  name: 'whoknows',
  description: 'See who knows the most about a certain artist, track or album in this server',
  options: {
    artist: {
      type: ApplicationCommandOptionType.Subcommand,
      description: 'See who knows the most about a certain artist in this server',
      options: {
        query: createTypeOptionForWhoKnows('artist'),
        range: createRangeOptionForWhoKnows()
      }
    },
    track: {
      type: ApplicationCommandOptionType.Subcommand,
      description: 'See who knows the most about a certain track in this server',
      options: {
        query: createTypeOptionForWhoKnows('track'),
        range: createRangeOptionForWhoKnows()
      }
    },
    album: {
      type: ApplicationCommandOptionType.Subcommand,
      description: 'See who knows the most about a certain album in this server',
      options: {
        query: createTypeOptionForWhoKnows('album'),
        range: createRangeOptionForWhoKnows()
      }
    }
  },
  contexts: [InteractionContextType.Guild],
  integration_types: [ApplicationIntegrationType.GuildInstall]
} as const satisfies CommandPayload;
