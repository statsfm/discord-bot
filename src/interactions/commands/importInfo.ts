import { CommandPayload } from '../../util/SlashCommandUtils';

export const ImportInfoCommand = {
  name: 'import-info',
  description: 'See the amount of streams in the import queue',
} as const satisfies CommandPayload;
