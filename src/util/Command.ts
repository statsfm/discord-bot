import type {
  Snowflake,
  Interaction,
  InteractionReplyOptions,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  UserContextMenuCommandInteraction,
  MessageContextMenuCommandInteraction,
  Message,
  CommandInteraction,
} from 'discord.js';
import { basename, extname } from 'node:path';
import type {
  ArgumentsOf,
  CommandPayload,
  SubCommandGroupOption,
  SubCommandNamesOf,
  SubCommandOption,
} from './SlashCommandUtils';
import type { StatsfmUser } from './StatsfmUser';

type RegisteredSubCommands = {
  [key: string]: SubCommandOption;
};

export const createCommand = <T extends CommandPayload>(payload: T) =>
  new Command<T>(payload);

export class Command<
  T extends CommandPayload,
  SubCommands extends RegisteredSubCommands = {},
> {
  private subCommands: SubCommands = {} as SubCommands;
  private guilds: Snowflake[] = [];
  private functions: CommandFunctions<T, SubCommands> = {};
  private managedCooldown = 0;
  private ownCooldown = false;
  private enabled = true;
  private privateApi = false;
  private requireStatsfmUser = true;

  constructor(private commandPayload: T) {}

  public registerSubCommand<N extends SubCommandNamesOf<T>>(
    name: N,
    // @ts-ignore
    subcommand: SubcommandFunction<T['options'][N]>
  ): Command<T, SubCommands & { [K in N]: T['options'][K] }> {
    this.subCommands = { ...this.subCommands, [name]: subcommand };
    return this;
  }

  public disable() {
    this.enabled = false;
    return this;
  }

  public enable() {
    this.enabled = true;
    return this;
  }

  public addGuild(guildId: Snowflake) {
    if (!this.guilds.includes(guildId)) {
      this.guilds.push(guildId);
    }
    return this;
  }

  public registerChatInput(chatInput: ChatInputFunction<T, SubCommands>) {
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

  public setOwnCooldown() {
    this.ownCooldown = !this.ownCooldown;
    return this;
  }

  public setManagedCooldown(cooldown: number) {
    this.managedCooldown = cooldown;
    return this;
  }

  public enablePrivateApiRequirement() {
    this.privateApi = true;
    return this;
  }

  public disablePrivateApiRequirement() {
    this.privateApi = false;
    return this;
  }

  public disableStatsfmUserRequirement() {
    this.requireStatsfmUser = false;
    return this;
  }

  public enableStatsfmUserRequirement() {
    this.requireStatsfmUser = true;
    return this;
  }

  public build(): BuildedCommand<T, SubCommands> {
    return {
      name: this.commandPayload.name,
      commandPayload: this.commandPayload,
      subCommands: this.subCommands,
      guilds: this.guilds,
      functions: this.functions,
      enabled: this.enabled,
      managedCooldown: this.managedCooldown,
      ownCooldown: this.ownCooldown,
      privateApi: this.privateApi,
      statsfmUserRequirement: this.requireStatsfmUser,
    };
  }
}

export interface BuildedCommand<
  C extends CommandPayload = CommandPayload,
  SubCommands extends RegisteredSubCommands = {},
> {
  name: string;
  commandPayload: C;
  subCommands: SubCommands;
  guilds: Snowflake[];
  functions: CommandFunctions<C, SubCommands>;
  enabled: boolean;
  managedCooldown: number;
  ownCooldown: boolean;
  privateApi: boolean;
  statsfmUserRequirement: boolean;
}

export interface CommandFunctions<
  T extends CommandPayload,
  SubCommands extends RegisteredSubCommands,
> {
  chatInput?: ChatInputFunction<T, SubCommands>;
  autocomplete?: AutocompleteFunction<T>;
  userContext?: UserContextFunction<T>;
  messageContext?: MessageContextFunction<T>;
}

export type StandardInteractionFunction<
  InteractionType extends Interaction,
  CommandOrSubCommand extends
    | CommandPayload
    | SubCommandOption
    | SubCommandGroupOption,
> = (context: {
  interaction: InteractionType;
  args: ArgumentsOf<CommandOrSubCommand>;
  statsfmUser: StatsfmUser | null;
  respond: RespondFunction;
}) => Awaitable<Message<boolean> | void>;

export type ChatInputFunction<
  T extends CommandPayload,
  SubCommands extends RegisteredSubCommands,
> = (context: {
  interaction: ChatInputCommandInteraction;
  args: ArgumentsOf<T>;
  statsfmUser: StatsfmUser | null;
  respond: RespondFunction;
  subCommands: {
    [K in keyof SubCommands]: SubcommandFunction<SubCommands[K]>;
  };
}) => Awaitable<Message<boolean> | void>;

export type AutocompleteFunction<T extends CommandPayload> =
  StandardInteractionFunction<AutocompleteInteraction, T>;

export type UserContextFunction<T extends CommandPayload> =
  StandardInteractionFunction<UserContextMenuCommandInteraction, T>;

export type MessageContextFunction<T extends CommandPayload> =
  StandardInteractionFunction<MessageContextMenuCommandInteraction, T>;

export type SubcommandFunction<T extends SubCommandOption> =
  StandardInteractionFunction<ChatInputCommandInteraction, T>;

export type RespondFunction = (
  interaction: CommandInteraction,
  data: InteractionReplyOptions
) => Promise<Message<boolean>>;

export interface ICommandInfo {
  name: string;
}

export function commandInfo(path: string): ICommandInfo | null {
  if (extname(path) !== '.js') {
    return null;
  }

  return { name: basename(path, '.js') };
}
