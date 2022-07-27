import type {
  APIApplicationCommandInteraction,
  APIInteraction,
  RESTPostAPIInteractionCallbackJSONBody,
  Snowflake,
} from 'discord-api-types/v9';
import { basename, extname } from 'node:path';
import type { ArgumentsOf, Command as ArgumentCommand } from './ArgumentsOf';

type CommandOptions<T extends ArgumentCommand> = {
  commandObject: T;
  subCommands?: Record<string, SubcommandFunction>;
};

export abstract class Command<T extends ArgumentCommand = any> {
  name: string;
  commandObject: T;
  subCommands: Record<string, SubcommandFunction>;

  constructor(options: CommandOptions<T>) {
    this.name = options.commandObject.name;
    this.commandObject = options.commandObject;
    this.subCommands = options.subCommands ?? {};
  }

  guilds?: Snowflake[];
  abstract execute(
    interaction: APIApplicationCommandInteraction,
    args: ArgumentsOf<T>,
    respond: RespondFunction
  ): Awaitable<void>;
}

export type SubcommandFunction = (
  interaction: APIInteraction,
  args: any,
  respond: RespondFunction
) => Awaitable<void>;

export type RespondFunction = (
  interaction: APIInteraction,
  data: RESTPostAPIInteractionCallbackJSONBody
) => Awaitable<void>;

export interface ICommandInfo {
  name: string;
}

export function commandInfo(path: string): ICommandInfo | null {
  if (extname(path) !== '.js') {
    return null;
  }

  return { name: basename(path, '.js') };
}
