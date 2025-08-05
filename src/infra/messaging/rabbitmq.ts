import amqp, { Connection, Channel } from 'amqplib';
import { config } from '../../config/index';

let connection: Connection;
let channel: Channel;

export async function connectRabbitMQ(): Promise<{ connection: Connection; channel: Channel }> {
  if (connection && channel) return { connection, channel };

  const channelModel = await amqp.connect(config.rabbitmq.url);
  connection = channelModel.connection;
  channel = await channelModel.createChannel();
  await channel.assertQueue(config.rabbitmq.orderQueue, { durable: true });
  await channel.assertQueue(config.rabbitmq.crmQueue, { 
    durable: true,
    deadLetterExchange: '', // default exchange
    deadLetterRoutingKey: config.rabbitmq.crmDLQ
  });
  await channel.assertQueue(config.rabbitmq.crmDLQ, { durable: true });

  return { connection, channel };
}
