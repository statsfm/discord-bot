import { Client, Constants } from 'discord.js';
import { on } from 'node:events';
import { inject, injectable } from 'tsyringe';
import { kLogger } from '../tokens';
import type { Event } from '../util/Event';
import type Logger from '../util/Logger';

@injectable()
export default class implements Event {
  public name = 'Client ready event';

  public event = Constants.Events.CLIENT_READY;

  public constructor(
    public readonly client: Client<true>,
    @inject(kLogger) public readonly logger: Logger
  ) {}

  public async execute(): Promise<void> {
    for await (const _ of on(this.client, this.event) as AsyncIterableIterator<
      [void]
    >) {
      this.client.user.setActivity('with the power of the bot');
      this.logger.info('Online');
    }
  }
}
