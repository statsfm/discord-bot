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
  options?: readonly Option[];
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

type UnionToIntersection<Union> = (
  Union extends unknown ? (k: Union) => void : never
) extends (k: infer Intersection) => void
  ? Intersection
  : never;

type CommandOptionTypeSwitch<
  CommandOptionType extends ApplicationCommandOptionType,
  Options,
  Choices
> = {
  [ApplicationCommandOptionType.Subcommand]: ArgumentsOfRaw<Options>;
  [ApplicationCommandOptionType.SubcommandGroup]: ArgumentsOfRaw<Options>;
  [ApplicationCommandOptionType.String]: Choices extends readonly {
    value: string;
  }[]
    ? Choices[number]['value']
    : string;
  [ApplicationCommandOptionType.Integer]: Choices extends readonly {
    value: number;
  }[]
    ? Choices[number]['value']
    : number;
  [ApplicationCommandOptionType.Number]: Choices extends readonly {
    value: number;
  }[]
    ? Choices[number]['value']
    : number;
  [ApplicationCommandOptionType.Boolean]: boolean;
  [ApplicationCommandOptionType.User]: {
    user: User;
    member?: GuildMember;
  };
  [ApplicationCommandOptionType.Channel]: GuildChannel;
  [ApplicationCommandOptionType.Role]: Role;
  [ApplicationCommandOptionType.Mentionable]:
    | { user: User; member?: GuildMember }
    | Role
    | undefined;
  [ApplicationCommandOptionType.Attachment]: Attachment;
}[CommandOptionType];

type TypeIdToType<CommandOptionType, Options, Choices> =
  CommandOptionType extends ApplicationCommandOptionType
    ? CommandOptionTypeSwitch<CommandOptionType, Options, Choices>
    : never;

type OptionToObject<_Options> = _Options extends {
  name: infer Name;
  type: infer Type;
  required?: infer Required;
  options?: infer Options;
  choices?: infer Choices;
}
  ? Name extends string
    ? Required extends true
      ? { [name in Name]: TypeIdToType<Type, Options, Choices> }
      : Type extends
          | ApplicationCommandOptionType.Subcommand
          | ApplicationCommandOptionType.SubcommandGroup
      ? { [name in Name]: TypeIdToType<Type, Options, Choices> }
      : { [name in Name]?: TypeIdToType<Type, Options, Choices> | undefined }
    : never
  : never;

type ArgumentsOfRaw<Options> = Options extends readonly any[]
  ? UnionToIntersection<OptionToObject<Options[number]>>
  : never;

export type ArgumentsOf<
  Command extends CommandPayload | SubCommandOption | SubCommandGroupOption
> = Command extends { options: readonly Option[] }
  ? UnionToIntersection<OptionToObject<Command['options'][number]>>
  : CommandIsOfType<Command, ApplicationCommandType.Message> extends true
  ? { message: Message<true> }
  : CommandIsOfType<Command, ApplicationCommandType.User> extends true
  ? { user: { user: User; member?: GuildMember } }
  : never;

type CommandIsOfType<
  Command extends CommandPayload | SubCommandOption | SubCommandGroupOption,
  type extends ApplicationCommandType
> = Command extends { type: type } ? true : false;

export type SubCommandNames<S extends SubCommandOption> =
  S['options'] extends readonly Option[] ? S['name'] : never;

export type SubCommandNamesOf<C extends CommandPayload> =
  C['options'] extends readonly Option[]
    ? C['options'][number] extends SubCommandOption
      ? // @ts-ignore
        SubCommandNames<C['options'][number]>
      : never
    : never;
