import { Client, Collection, Constants } from 'discord.js';
import { inject, injectable } from 'tsyringe';
import type { ICommand } from '../util/Command';
import type { IEvent } from '../util/Event';
import { transformInteraction } from '../util/InteractionOptions';
import type { Logger } from '../util/Logger';
import { kCommands, kLogger } from '../util/tokens';

@injectable()
export default class implements IEvent {
  public name = 'Interaction handling';

  public event = Constants.Events.INTERACTION_CREATE;

  public constructor(
    public readonly client: Client<true>,
    @inject(kCommands) public readonly commands: Collection<string, ICommand>,
    @inject(kLogger) public readonly logger: Logger
  ) {}

  public execute(): void {
    this.client.on(this.event, async (interaction) => {
      if (!interaction.isCommand() && !interaction.isContextMenu()) return;

      if (!interaction.inCachedGuild()) return;

      const command = this.commands.get(interaction.commandName.toLowerCase());

      if (!command) return;
      try {
        // TODO: Store command stats
        // Check if command is guild locked
        if (command.guilds && command.guilds.length > 0) {
          if (!command.guilds.includes(interaction.guild.id))
            return interaction.reply(
              'This command is not available in this guild!'
            );
        }
        await command.execute(
          interaction,
          transformInteraction(interaction.options.data)
        );
      } catch (e) {
        const firstCatchError = e as Error;
        this.logger.error(firstCatchError.message, firstCatchError.stack);
        try {
          if (!interaction.deferred && !interaction.replied) {
            this.logger.warn(
              `Interaction ${interaction.commandName ?? ''} (${
                interaction.type
              }) has not been deferred before throwing executed by ${
                interaction.user.tag
              } (${interaction.user.id})`
            );
            await interaction.deferReply();
          }

          await interaction.editReply({
            content: firstCatchError.message,
            components: [],
          });
        } catch (err) {
          const secondCatchError = err as Error;
          this.logger.error(secondCatchError.message, secondCatchError.stack);
        }
      }
    });
  }
}
