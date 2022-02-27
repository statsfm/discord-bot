import type { BaseCommandInteraction, Snowflake } from 'discord.js';
import { basename, extname } from 'node:path';
import type { Command as ArgumentCommand } from './ArgumentsOf';

export interface ICommand {
  name?: string;
  commandObject: ArgumentCommand;
  guilds?: Snowflake[];
  execute(
    interaction: BaseCommandInteraction<'cached'>,
    args: any
  ): Promise<unknown>;
}

export interface ICommandInfo {
  name: string;
}

export function commandInfo(path: string): ICommandInfo | null {
  if (extname(path) !== '.js') {
    return null;
  }

  return { name: basename(path, '.js') };
}
