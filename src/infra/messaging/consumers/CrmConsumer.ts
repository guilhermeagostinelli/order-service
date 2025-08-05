import { config } from '../../../config';
import { CrmBatchProcessor } from '../../../application/batches/CrmBatchProcessor';
import { RabbitMQMessageHandler } from '../RabbitMQMessageHandler';
import { ILogger } from '../../../core/logger/ILogger';
import { IConsumer } from './IConsumer';
import { Channel } from 'amqplib';
import { IBatchProcessor } from '../../../core/batches/IBatchProcessor';

export class CrmConsumer implements IConsumer {
  constructor(
    private readonly logger: ILogger,
    private readonly channel: Channel,
    private readonly processor: IBatchProcessor = CrmBatchProcessor.getInstance()
  ) {}

  async start(): Promise<void> {
    await this.channel.consume(config.rabbitmq.crmQueue, async (msg) => {
      if (!msg) return;
      try {
        const messageHandler = new RabbitMQMessageHandler(this.channel, msg);
        const payload = JSON.parse(msg.content.toString());
        await this.processor.addToBatch(payload, messageHandler);
      } catch (err) {
        this.logger.error('Failed to process CRM message:', err);
        // Will go to DLQ...
        this.channel.nack(msg, false, false);
      }
    });
  }
}