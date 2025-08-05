import { Channel, Message } from "amqplib";
import { IMessageHandler } from "../../core/messaging/IMessageHandler";

export class RabbitMQMessageHandler implements IMessageHandler {
  constructor(
    private readonly channel: Channel,
    private readonly message: Message
  ) {}

  acknowledge() {
    this.channel.ack(this.message);
  }

  reject() {
    this.channel.nack(this.message, false, false);
  }
}