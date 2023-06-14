import { container } from 'tsyringe';
import { PingCommand } from '../../interactions';
import { Analytics } from '../../util/analytics';
import { createCommand } from '../../util/Command';
import { kAnalytics } from '../../util/tokens';

const analytics = container.resolve<Analytics>(kAnalytics);

export default createCommand(PingCommand)
  .registerChatInput(async ({ interaction, args, respond }) => {
    await analytics.trackEvent('PING', interaction.user.id);
    await interaction.deferReply({
      ephemeral: args.hide,
    });

    await respond(interaction, {
      content: 'Pong!',
    });
  })
  .build();
