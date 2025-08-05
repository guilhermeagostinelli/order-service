import { config } from '../../../config';
import { getHandler } from '../../../application/handlers/orderEventHandlersRegistry';
import { OrderEvent } from '../../../core/messaging/OrderEvent';
import { IConsumer } from './IConsumer';
import { ILogger } from '../../../core/logger/ILogger';
import { Channel } from 'amqplib';

export class OrderConsumer implements IConsumer {
  constructor(
    private readonly logger: ILogger,
    private readonly channel: Channel
  ) {}

  async start(): Promise<void> {
    await this.channel.consume(config.rabbitmq.orderQueue, async (msg) => {
      if (!msg) return;
      try {
        const event: OrderEvent = JSON.parse(msg.content.toString());
        const handler = getHandler(event.type, this.channel);
        if (!handler) {
          this.logger.warn(`No handler for type ${event.type}`);
          return this.channel.nack(msg, false, false);
        }
        await handler.handle(event.payload);
        this.channel.ack(msg);
      } catch (err) {
        this.logger.error('Failed to process order message:', err);
        this.channel.nack(msg, false, false);
      }
    });
  }
}