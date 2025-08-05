import { createLogger } from './infra/logger/loggerFactory';
import { CrmConsumer } from './infra/messaging/consumers/CrmConsumer';
import { OrderConsumer } from './infra/messaging/consumers/OrderConsumer';
import { connectRabbitMQ } from './infra/messaging/rabbitmq';

async function bootstrap() {
  const logger = createLogger();
  const { channel } = await connectRabbitMQ();
  const consumers = [
    new CrmConsumer(logger, channel),
    new OrderConsumer(logger, channel)
  ];
  for (const consumer of consumers) {
    await consumer.start();
  }
}

bootstrap();
