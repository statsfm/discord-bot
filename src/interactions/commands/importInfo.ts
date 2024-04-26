import {
  ApplicationIntegrationType,
  CommandPayload,
  InteractionContextType,
} from '../../util/SlashCommandUtils';

export const ImportInfoCommand = {
  name: 'import-info',
  description: 'See the amount of streams in the import queue',
  contexts: [InteractionContextType.Guild],
  integration_types: [ApplicationIntegrationType.GuildInstall],
} as const satisfies CommandPayload;
