import { inject, injectable } from 'tsyringe';
import { kClient, kLogger } from '../util/tokens';
import type { IEvent } from '../util/Event';
import type { Logger } from '../util/Logger';
import type { Client } from 'discord.js';

@injectable()
export default class implements IEvent {
  public name = 'Gateway ready event';

  public constructor(
    @inject(kClient) public readonly client: Client,
    @inject(kLogger) public readonly logger: Logger
  ) {}

  public execute(): void {
    this.client.on('ready', () => {
      this.logger.info('Online');
    });
  }
}
