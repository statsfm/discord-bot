import type { Rest } from '@cordis/rest';
import {
  MessageFlags,
  ChatInputCommandInteraction,
  Client,
  Interaction,
  InteractionReplyOptions,
  InteractionType,
  MessageComponentInteraction,
  MessagePayload,
  ModalSubmitInteraction,
} from 'discord.js';
import { inject, injectable } from 'tsyringe';
import type { BuildedCommand } from '../util/Command';
import { Config } from '../util/Config';
import type { IEvent } from '../util/Event';
import { transformInteraction } from '../util/InteractionOptions';
import type { Logger } from '../util/Logger';
import { kCommands, kClient, kLogger, kRest } from '../util/tokens';

@injectable()
export default class implements IEvent {
  public name = 'Interaction handling';

  public constructor(
    public readonly config: Config,
    @inject(kClient) public readonly client: Client,
    @inject(kCommands)
    public readonly commands: Map<string, BuildedCommand<any>>,
    @inject(kRest) public readonly rest: Rest,
    @inject(kLogger) public readonly logger: Logger
  ) {}

  public execute(): void {
    this.client.on('interactionCreate', (interaction: Interaction) => {
      try {
        // We don't handle DM interactions.
        if (!interaction.inCachedGuild()) return;

        if (interaction.isChatInputCommand())
          return this.handleChatInputCommand(interaction);
        if (interaction.isMessageComponent())
          return this.handleMessageComponent(interaction);
        if (interaction.isModalSubmit()) return this.handleModal(interaction);
        this.logger.error('Uncaught error while handling interaction');
        return this.respond(interaction, {
          content:
            'Something went wrong while handling this interaction - please mail us at support@stats.fm if you see this with steps on how to reproduce',
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        this.logger.error(
          'Uncaught error while handling interaction',
          error as string
        );
        return this.respond(interaction, {
          content:
            'Something went wrong while handling this interaction - please mail us at support@stats.fm if you see this with steps on how to reproduce',
          flags: MessageFlags.Ephemeral,
        });
      }
    });
  }

  public async handleChatInputCommand(
    interaction: ChatInputCommandInteraction<'cached'>
  ) {
    if (interaction.type !== InteractionType.ApplicationCommand) {
      this.logger.warn(
        'Got interaction with non-chat input command',
        JSON.stringify(interaction, null, 2)
      );
      return this.respond(interaction, {
        content:
          'This command is a non-chat input command - if you somehow managed to get this error, please modmail us on how',
        flags: MessageFlags.Ephemeral,
      });
    }

    const command = this.commands.get(interaction.commandName.toLowerCase());
    if (!command) return;
    try {
      // TODO: Store command stats
      // Check if command is guild locked
      if (command.guilds && command.guilds.length > 0 && interaction.guildId) {
        if (!command.guilds.includes(interaction.guildId))
          return this.respond(interaction, {
            content: 'This command is not available in this guild!',
            flags: MessageFlags.Ephemeral,
          });
      }
      if (command.functions.chatInput)
        await command.functions.chatInput(
          interaction,
          transformInteraction(interaction.options.data),
          this.respond.bind(this),
          command.subCommands
        );
    } catch (error) {
      console.log(error);
    }
  }

  public handleMessageComponent(_interaction: MessageComponentInteraction) {
    //
  }

  public handleModal(_interaction: ModalSubmitInteraction) {
    //
  }

  public async respond(
    interaction: Interaction,
    data: string | MessagePayload | InteractionReplyOptions
  ): Promise<void> {
    // Not Ping or Autocomplete
    if (interaction.isRepliable()) {
      if (interaction.deferred) {
        return void interaction.editReply(data);
      }
      await interaction.reply(data);
      return;
    }
    if (interaction.isAutocomplete()) {
      // TODO: Handle Autocomplete
      return;
    }
  }
}
