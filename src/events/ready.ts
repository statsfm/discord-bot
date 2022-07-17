import { inject, injectable } from 'tsyringe';
import { kGateway, kLogger } from '../util/tokens';
import type { IEvent } from '../util/Event';
import type { Logger } from '../util/Logger';
import type { Cluster } from '@cordis/gateway';

@injectable()
export default class implements IEvent {
  public name = 'Gateway ready event';

  public constructor(
    @inject(kGateway) public readonly gateway: Cluster,
    @inject(kLogger) public readonly logger: Logger
  ) {}

  public execute(): void {
    this.gateway.on('ready', () => {
      this.logger.info('Online');
    });
  }
}
