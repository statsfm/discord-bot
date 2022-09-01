import type {
  Snowflake,
  Interaction,
  InteractionReplyOptions,
  MessagePayload,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
} from 'discord.js';
import { basename, extname } from 'node:path';
import type {
  ArgumentsOf,
  CommandPayload,
  SubCommandGroupOption,
  SubCommandNamesOf,
  SubCommandOption,
} from './SlashCommandUtils';

export const createCommand = <T extends CommandPayload>(payload: T) => {
  return new Command<T>(payload);
};

export class Command<T extends CommandPayload> {
  private subCommands: Record<string, SubcommandFunction<any>> = {};
  private guilds: Snowflake[] = [];
  private functions: CommandFunctions<T> = {};

  constructor(private commandPayload: T) {}

  // TODO: add support for auto getting arguments from the generics.
  public registerSubCommand<
    N extends SubCommandNamesOf<T>,
    A extends SubCommandOption
  >(name: N, _args: A, subcommand: SubcommandFunction<A>) {
    this.subCommands = { ...this.subCommands, [name]: subcommand };
    return this;
  }

  public addGuild(guildId: Snowflake) {
    if (!this.guilds.includes(guildId)) {
      this.guilds.push(guildId);
    }
    return this;
  }

  public registerChatInput(chatInput: ChatInputFunction<T>) {
    this.functions.chatInput = chatInput;
    return this;
  }

  public registerAutocomplete(autocomplete: AutocompleteFunction<T>) {
    this.functions.autocomplete = autocomplete;
    return this;
  }

  public registerUserContext(userContext: UserContextFunction<T>) {
    this.functions.userContext = userContext;
    return this;
  }

  public registerMessageContext(messageContext: MessageContextFunction<T>) {
    this.functions.messageContext = messageContext;
    return this;
  }

  public build(): BuildedCommand<T> {
    return {
      name: this.commandPayload.name,
      commandPayload: this.commandPayload,
      subCommands: this.subCommands,
      guilds: this.guilds,
      functions: this.functions,
    };
  }
}

export interface BuildedCommand<C extends CommandPayload> {
  name: string;
  commandPayload: C;
  subCommands: Record<SubCommandNamesOf<C>, SubcommandFunction<any>>;
  guilds: Snowflake[];
  functions: CommandFunctions<C>;
}

export interface CommandFunctions<T extends CommandPayload> {
  chatInput?: ChatInputFunction<T>;
  autocomplete?: AutocompleteFunction<T>;
  userContext?: UserContextFunction<T>;
  messageContext?: MessageContextFunction<T>;
}

export type StandardInteractionFunction<
  InteractionType extends Interaction,
  CommandOrSubCommand extends
    | CommandPayload
    | SubCommandOption
    | SubCommandGroupOption
> = (
  interaction: InteractionType,
  args: ArgumentsOf<CommandOrSubCommand>,
  respond: RespondFunction
) => Awaitable<void>;

export type ChatInputFunction<T extends CommandPayload> = (
  interaction: ChatInputCommandInteraction<'cached'>,
  args: ArgumentsOf<T>,
  respond: RespondFunction,
  // TODO: Fix any to become injected from from the selected subcommand name.
  subCommands: Record<SubCommandNamesOf<T>, SubcommandFunction<any>>
) => Awaitable<void>;

export type AutocompleteFunction<T extends CommandPayload> =
  StandardInteractionFunction<AutocompleteInteraction<'cached'>, T>;

export type UserContextFunction<T extends CommandPayload> =
  StandardInteractionFunction<UserContextMenuCommandInteraction<'cached'>, T>;

export type MessageContextFunction<T extends CommandPayload> =
  StandardInteractionFunction<
    MessageContextMenuCommandInteraction<'cached'>,
    T
  >;

export type SubcommandFunction<T extends SubCommandOption> =
  StandardInteractionFunction<ChatInputCommandInteraction<'cached'>, T>;

export type RespondFunction = (
  interaction: Interaction,
  data: string | MessagePayload | InteractionReplyOptions
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
