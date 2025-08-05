import { config } from '../../config';
import { IOrderEventHandler } from './IOrderEventHandler';
import { CreateOrderDTO } from '../../core/dtos/CreateOrderDTO';
import { ILogger } from '../../core/logger/ILogger';
import { createLogger } from '../../infra/logger/loggerFactory';
import { IOrderRepository } from '../../core/repositories/IOrderRepository';
import { createOrderRepository } from '../../infra/db/repositories/repositoriesFactory';
import { IMessagingChannel } from '../../core/messaging/IMessagingChannel';

export class OrderCreatedEventHandler implements IOrderEventHandler {
  constructor(
    private readonly messagingChannel: IMessagingChannel,
    private readonly logger: ILogger = createLogger(),
    private readonly repo: IOrderRepository = createOrderRepository(),
  ) {}

  async handle(payload: any): Promise<void> {
    const order: CreateOrderDTO = {
      customer_email: payload.customer_email,
      total_amount: payload.total_amount
    };

    await this.repo.save(order);
    this.logger.info('[order.created] Order saved:', order);

    const crmPayload = {
      email: order.customer_email,
      amount: order.total_amount,
      timestamp: new Date().toISOString()
    };

    this.messagingChannel.sendToQueue(config.rabbitmq.crmQueue, Buffer.from(JSON.stringify(crmPayload)), {
      persistent: true
    });

    this.logger.info('CRM event enqueued');
  }
}