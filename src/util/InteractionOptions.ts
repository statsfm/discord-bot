import {
  type CommandInteractionOption,
  ApplicationCommandOptionType,
  type GuildBasedChannel,
  type Role,
  type User,
  type GuildMember,
  type Attachment,
  type Message,
  CacheType,
  CacheTypeReducer,
  APIInteractionDataResolvedChannel,
  APIRole,
  BooleanCache,
  APIInteractionDataResolvedGuildMember
} from 'discord.js';

import type { ArgumentsOf, CommandPayload } from './SlashCommandUtils';

export function transformInteraction<
  CmdPayload extends CommandPayload = CommandPayload,
  Cache extends CacheType = undefined
>(options: readonly CommandInteractionOption<Cache>[]): ArgumentsOf<CmdPayload, Cache> {
  const opts: Record<
    string,
    | ArgumentsOf<CmdPayload, Cache>
    | {
        member:
          | CacheTypeReducer<Cache, GuildMember, APIInteractionDataResolvedGuildMember>
          | undefined;
        user: User | undefined;
      }
    | CacheTypeReducer<Cache, GuildBasedChannel, APIInteractionDataResolvedChannel>
    | CacheTypeReducer<Cache, Role, APIRole>
    | string
    | number
    | boolean
    | Attachment
    | Message<BooleanCache<Cache>>
    | undefined
  > = {};

  for (const top of options) {
    switch (top.type) {
      case ApplicationCommandOptionType.Subcommand:
      case ApplicationCommandOptionType.SubcommandGroup:
        opts[top.name] = transformInteraction<CmdPayload>(top.options ? [...top.options] : []);
        break;
      case ApplicationCommandOptionType.User:
        opts[top.name] = { user: top.user, member: top.member };
        break;
      case ApplicationCommandOptionType.Channel:
        opts[top.name] = top.channel;
        break;
      case ApplicationCommandOptionType.Role:
        opts[top.name] = top.role;
        break;
      case ApplicationCommandOptionType.Mentionable:
        opts[top.name] = top.user ? { user: top.user, member: top.member } : top.role;
        break;
      case ApplicationCommandOptionType.Number:
      case ApplicationCommandOptionType.Integer:
      case ApplicationCommandOptionType.String:
      case ApplicationCommandOptionType.Boolean:
        opts[top.name] = top.value;
        break;
      case ApplicationCommandOptionType.Attachment:
        opts[top.name] = top.attachment;
        break;
      // @ts-expect-error: This is actually a string
      case '_MESSAGE':
        opts[top.name] = top.message;
        break;
      default:
        break;
    }
  }

  return opts as ArgumentsOf<CmdPayload>;
}
