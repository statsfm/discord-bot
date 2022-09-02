import type {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  Attachment,
  GuildChannel,
  GuildMember,
  Message,
  Role,
  User,
  LocaleString,
  ChannelType,
} from 'discord.js';

export type CommandPayload = Readonly<{
  type?: ApplicationCommandType;
  name: string;
  name_localizations?: Record<LocaleString, string>;
  description: string;
  description_localizations?: Record<LocaleString, string>;
  options: readonly Option[];
}>;

type BaseOption = Readonly<{
  name: string;
  name_localizations?: Record<LocaleString, string>;
  description: string;
  description_localizations?: Record<LocaleString, string>;
  required?: boolean;
  type: ApplicationCommandOptionType;
}>;

export type SubCommandOption = BaseOption &
  Readonly<{
    type: ApplicationCommandOptionType.Subcommand;
    options?: readonly BaseOption[];
  }>;

export type SubCommandGroupOption = BaseOption &
  Readonly<{
    type: ApplicationCommandOptionType.SubcommandGroup;
    options?: readonly SubCommandOption[];
  }>;

export type StringOption = BaseOption &
  Readonly<{
    type: ApplicationCommandOptionType.String;
    choices?: readonly Readonly<{ name: string; value: string }>[];
    minLength?: number;
    maxLength?: number;
    autocomplete?: boolean;
  }>;

export type NumberOption = BaseOption &
  Readonly<{
    type: ApplicationCommandOptionType.Number;
    min_value?: number;
    max_value?: number;
    autocomplete?: boolean;
  }>;

export type IntegerOption = BaseOption &
  Readonly<{
    type: ApplicationCommandOptionType.Integer;
    min_value?: number;
    max_value?: number;
    autocomplete?: boolean;
  }>;

export type BooleanOption = BaseOption & {
  type: ApplicationCommandOptionType.Boolean;
};

export type UserOption = BaseOption & {
  type: ApplicationCommandOptionType.User;
};

export type RoleOption = BaseOption & {
  type: ApplicationCommandOptionType.Role;
};

export type ChannelOption = BaseOption & {
  type: ApplicationCommandOptionType.Channel;
  channel_types: Exclude<ChannelType, ChannelType.DM | ChannelType.GroupDM>[];
};

export type AttachmentOption = BaseOption & {
  type: ApplicationCommandOptionType.Attachment;
};

export type MentionableOption = BaseOption & {
  type: ApplicationCommandOptionType.Mentionable;
};

export type BasicOptions =
  | StringOption
  | NumberOption
  | IntegerOption
  | BooleanOption
  | UserOption
  | RoleOption
  | ChannelOption
  | AttachmentOption
  | MentionableOption;

export type Option = SubCommandOption | SubCommandGroupOption | BasicOptions;

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type TypeIdToType<T, O, C> = T extends ApplicationCommandOptionType.Subcommand
  ? ArgumentsOfRaw<O>
  : T extends ApplicationCommandOptionType.SubcommandGroup
  ? ArgumentsOfRaw<O>
  : T extends ApplicationCommandOptionType.String
  ? C extends readonly { value: string }[]
    ? C[number]['value']
    : string
  : T extends
      | ApplicationCommandOptionType.Integer
      | ApplicationCommandOptionType.Number
  ? C extends readonly { value: number }[]
    ? C[number]['value']
    : number
  : T extends ApplicationCommandOptionType.Boolean
  ? boolean
  : T extends ApplicationCommandOptionType.User
  ? {
      user: User;
      member?: GuildMember;
    }
  : T extends ApplicationCommandOptionType.Channel
  ? GuildChannel
  : T extends ApplicationCommandOptionType.Role
  ? Role
  : T extends ApplicationCommandOptionType.Mentionable
  ?
      | {
          user: User;
          member?: GuildMember;
        }
      | Role
      | undefined
  : T extends ApplicationCommandOptionType.Attachment
  ? Attachment
  : never;

type OptionToObject<_O> = _O extends {
  name: infer K;
  type: infer T;
  required?: infer R;
  options?: infer O;
  choices?: infer C;
}
  ? K extends string
    ? R extends true
      ? { [k in K]: TypeIdToType<T, O, C> }
      : T extends
          | ApplicationCommandOptionType.Subcommand
          | ApplicationCommandOptionType.SubcommandGroup
      ? { [k in K]: TypeIdToType<T, O, C> }
      : { [k in K]?: TypeIdToType<T, O, C> | undefined }
    : never
  : never;

type ArgumentsOfRaw<O> = O extends readonly any[]
  ? UnionToIntersection<OptionToObject<O[number]>>
  : never;

export type ArgumentsOf<
  C extends CommandPayload | SubCommandOption | SubCommandGroupOption
> = C extends {
  options: readonly Option[];
}
  ? UnionToIntersection<OptionToObject<C['options'][number]>>
  : C extends { type: ApplicationCommandType.Message }
  ? { message: Message<true> }
  : C extends { type: ApplicationCommandType.User }
  ? { user: { user: User; member?: GuildMember } }
  : never;

export type SubCommandNames<S extends SubCommandOption> =
  S['options'] extends readonly Option[] ? S['name'] : never;

export type SubCommandNamesOf<C extends CommandPayload> =
  C['options'] extends readonly Option[]
    ? C['options'][number] extends SubCommandOption
      ? // @ts-ignore
        SubCommandNames<C['options'][number]>
      : never
    : never;
