import { container } from 'tsyringe';
import { PingCommand } from '../../interactions';
import { Analytics } from '../../util/Analytics';
import { createCommand } from '../../util/Command';

const analytics = container.resolve(Analytics);

export default createCommand(PingCommand)
  .registerChatInput(async ({ interaction, args, respond }) => {
    await analytics.track('PING');
    await interaction.deferReply({
      ephemeral: args.hide,
    });

    await respond(interaction, {
      content: 'Pong!',
    });
  })
  .build();
