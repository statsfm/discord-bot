import { inject, injectable } from 'tsyringe';
import { kClient, kLogger } from '../util/tokens';
import type { IEvent } from '../util/Event';
import type { Logger } from '../util/Logger';
import type { Client } from 'discord.js';

@injectable()
export default class implements IEvent {
  public name = 'Gateway debug event';

  public constructor(
    @inject(kClient) public readonly client: Client<true>,
    @inject(kLogger) public readonly logger: Logger
  ) {}

  public async execute(): Promise<void> {
    if (process.env.NODE_ENV && process.env.NODE_ENV === 'development') {
      this.client.on('debug', async (info) => {
        this.logger.debug(`${info}`);
      });
    }
  }
}
