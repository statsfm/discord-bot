import { inject, injectable } from 'tsyringe';
import { kGateway, kLogger } from '../util/tokens';
import type { IEvent } from '../util/Event';
import type { Logger } from '../util/Logger';
import type { Cluster } from '@cordis/gateway';

@injectable()
export default class implements IEvent {
  public name = 'Gateway debug event';

  public constructor(
    @inject(kGateway) public readonly gateway: Cluster,
    @inject(kLogger) public readonly logger: Logger
  ) {}

  public async execute(): Promise<void> {
    if (process.env.NODE_ENV && process.env.NODE_ENV === 'development') {
      this.gateway.on('debug', async (info, id) => {
        this.logger.debug(`[${id}] ${info}`);
      });
    }
  }
}
