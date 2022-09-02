import type { Rest } from '@cordis/rest';
import {
  MessageFlags,
  Client,
  InteractionReplyOptions,
  ApplicationCommandType,
  Message,
  CommandInteraction,
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
    this.client.on('interactionCreate', async (interaction) => {
      if (
        !interaction.isCommand() &&
        !interaction.isUserContextMenuCommand() &&
        !interaction.isMessageContextMenuCommand() &&
        !interaction.isAutocomplete()
      )
        return;

      // We don't handle DM interactions.
      if (!interaction.inCachedGuild()) return;

      const command = this.commands.get(interaction.commandName.toLowerCase());

      if (command) {
        try {
          // TODO: Store command stats
          // Check if command is guild locked
          if (
            command.guilds &&
            command.guilds.length > 0 &&
            interaction.guildId
          ) {
            if (!command.guilds.includes(interaction.guildId)) {
              if (!interaction.isAutocomplete())
                await this.respond(interaction, {
                  content: 'This command is not available in this guild!',
                  flags: MessageFlags.Ephemeral,
                });
              return;
            }
          }
          switch (interaction.commandType) {
            case ApplicationCommandType.ChatInput:
              const isAutocomplete = interaction.isAutocomplete();

              this.logger.info(
                `Executing ${
                  isAutocomplete ? 'autocomplete' : 'chat input'
                } command ${interaction.commandName} by ${
                  interaction.user.tag
                } (${interaction.user.id}) in ${interaction.guildId}`
              );

              if (isAutocomplete) {
                if (command.functions.autocomplete)
                  await command.functions.autocomplete(
                    interaction,
                    transformInteraction(interaction.options.data),
                    this.respond.bind(this)
                  );
                break;
              }
              if (command.functions.chatInput)
                await command.functions.chatInput(
                  interaction,
                  transformInteraction(interaction.options.data),
                  this.respond.bind(this),
                  command.subCommands
                );
              break;

            case ApplicationCommandType.Message:
              this.logger.info(
                `Executing message context command ${interaction.commandName} by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guildId}`
              );

              if (command.functions.messageContext) {
                await command.functions.messageContext(
                  interaction,
                  transformInteraction(interaction.options.data),
                  this.respond.bind(this)
                );
              }
              break;

            case ApplicationCommandType.User:
              this.logger.info(
                `Executing user context command ${interaction.commandName} by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guildId}`
              );

              if (command.functions.userContext) {
                await command.functions.userContext(
                  interaction,
                  transformInteraction(interaction.options.data),
                  this.respond.bind(this)
                );
              }
              break;
          }
        } catch (e) {}
      }
    });
  }

  public async respond(
    interaction: CommandInteraction,
    data: InteractionReplyOptions
  ): Promise<Message<boolean>> {
    if (interaction.deferred) {
      return interaction.editReply(data);
    }
    return interaction.reply({ ...data, fetchReply: true });
  }
}
