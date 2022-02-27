import type { BaseCommandInteraction } from 'discord.js';

import { PingCommand } from '../../interactions';
import type { ArgumentsOf } from '../../util/ArgumentsOf';
import type { ICommand } from '../../util/Command';

export default class implements ICommand {
  commandObject = PingCommand;

  guilds = ['901602034443227166'];

  public async execute(
    interaction: BaseCommandInteraction<'cached'>,
    args: ArgumentsOf<typeof PingCommand>
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: args.hide ?? false });

    await interaction.editReply({
      content: 'Pong!',
    });
  }
}
