import type { BaseCommandInteraction, Snowflake } from 'discord.js';
import { basename, extname } from 'node:path';
import type { Command as ArgumentCommand } from './ArgumentsOf';

export interface Command {
  name?: string;
  commandObject: ArgumentCommand;
  guilds?: Snowflake[];
  execute(
    interaction: BaseCommandInteraction<'cached'>,
    args: any
  ): unknown | Promise<unknown>;
}

export interface CommandInfo {
  name: string;
}

export function commandInfo(path: string): CommandInfo | null {
  if (extname(path) !== '.js') {
    return null;
  }

  return { name: basename(path, '.js') };
}
