import {
  APIInteraction,
  InteractionResponseType,
  MessageFlags,
} from 'discord-api-types/v9';

import { PingCommand } from '../../interactions';
import type { ArgumentsOf } from '../../util/ArgumentsOf';
import { Command, RespondFunction } from '../../util/Command';

export default class Ping extends Command<typeof PingCommand> {
  constructor() {
    super({
      commandObject: PingCommand,
    });
  }

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof PingCommand>,
    respond: RespondFunction
  ): Promise<void> {
    await respond(interaction, {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
      data: {
        flags: args.hide ? MessageFlags.Ephemeral : 0,
      },
    });

    await respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: 'Pong!',
      },
    });
  }
}
