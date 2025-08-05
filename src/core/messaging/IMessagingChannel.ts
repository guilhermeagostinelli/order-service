export interface IMessagingChannel {
  sendToQueue(queue: string, content: Buffer, options?: { persistent: boolean }): void;
}
