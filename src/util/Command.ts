import type {
  APIApplicationCommandInteraction,
  APIInteraction,
  RESTPostAPIInteractionCallbackJSONBody,
  Snowflake,
} from 'discord-api-types/v9';
import { basename, extname } from 'node:path';
import type { Command as ArgumentCommand } from './ArgumentsOf';

export interface ICommand {
  name?: string;
  commandObject: ArgumentCommand;
  guilds?: Snowflake[];
  execute(
    interaction: APIApplicationCommandInteraction,
    args: any,
    respond: RespondFunction
  ): Awaited<unknown>;
}

export type RespondFunction = (
  interaction: APIInteraction,
  data: RESTPostAPIInteractionCallbackJSONBody
) => Promise<unknown>;

export interface ICommandInfo {
  name: string;
}

export function commandInfo(path: string): ICommandInfo | null {
  if (extname(path) !== '.js') {
    return null;
  }

  return { name: basename(path, '.js') };
}
