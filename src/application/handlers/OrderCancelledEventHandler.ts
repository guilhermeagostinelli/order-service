import { ILogger } from '../../core/logger/ILogger';
import { createLogger } from '../../infra/logger/loggerFactory';
import { IOrderEventHandler } from './IOrderEventHandler';

export class OrderCancelledEventHandler implements IOrderEventHandler {
  constructor(private readonly logger: ILogger = createLogger()) {}

  async handle(payload: any): Promise<void> {
    // Here we could update order status in the database and do other necessary actions...
    this.logger.info('[order.cancelled] Order cancelled:', payload);
  }
}
