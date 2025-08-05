import { IOrderEventHandler } from './IOrderEventHandler';
import { OrderCreatedEventHandler } from './OrderCreatedEventHandler';
import { OrderCancelledEventHandler } from './OrderCancelledEventHandler';
import { IMessagingChannel } from '../../core/messaging/IMessagingChannel';

export function getHandler(
  eventType: string,
  messagingChannel: IMessagingChannel
): IOrderEventHandler | null {
  switch (eventType) {
    case 'order.created':
      return new OrderCreatedEventHandler(messagingChannel);
    case 'order.cancelled':
      return new OrderCancelledEventHandler();
    default:
      return null;
  }
}
