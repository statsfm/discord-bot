import { PingCommand } from '../../interactions';
import { createCommand } from '../../util/Command';

export default createCommand(PingCommand)
  .registerChatInput(async ({ interaction, args, respond }) => {
    await interaction.deferReply({
      ephemeral: args.hide,
    });

    await respond(interaction, {
      content: 'Pong!',
    });
  })
  .build();
