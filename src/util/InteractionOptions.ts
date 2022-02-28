import {
  APIApplicationCommandInteractionDataOption,
  APIChatInputApplicationCommandInteractionDataResolved,
  ApplicationCommandOptionType,
} from 'discord-api-types/v9';

import type { ArgumentsOf, Command } from './ArgumentsOf';

export function transformInteraction<T extends Command>(
  options: readonly APIApplicationCommandInteractionDataOption[] = [],
  resolved: APIChatInputApplicationCommandInteractionDataResolved = {}
): ArgumentsOf<T> {
  const opts: any = {};

  for (const top of options) {
    if (
      top.type === ApplicationCommandOptionType.Subcommand ||
      top.type === ApplicationCommandOptionType.SubcommandGroup
    ) {
      opts[top.name] = transformInteraction(
        top.options ? [...top.options] : [],
        resolved
      );
    } else if (top.type === ApplicationCommandOptionType.User) {
      opts[top.name] = {
        user: resolved.users![top.value],
        member: resolved.members![top.value],
      };
    } else if (top.type === ApplicationCommandOptionType.Channel) {
      opts[top.name] = resolved.channels![top.value];
    } else if (top.type === ApplicationCommandOptionType.Role) {
      opts[top.name] = resolved.roles![top.value];
    } else {
      opts[top.name] = top.value;
    }
  }

  return opts;
}
