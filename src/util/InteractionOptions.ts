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
  const opts: Record<string, unknown> = {};

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
        user:
          top.value in (resolved.users ?? {})
            ? resolved.users![top.value]
            : null,
        member:
          top.value in (resolved.members! ?? {})
            ? resolved.members![top.value]
            : null,
      };
    } else if (top.type === ApplicationCommandOptionType.Channel) {
      opts[top.name] =
        top.value in (resolved.channels ?? {})
          ? resolved.channels![top.value]
          : null;
    } else if (top.type === ApplicationCommandOptionType.Role) {
      opts[top.name] =
        top.value in (resolved.roles ?? {}) ? resolved.roles![top.value] : null;
    } else {
      opts[top.name] = top.value;
    }
  }

  return opts as ArgumentsOf<T>;
}
