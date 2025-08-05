import { getHandler } from '../../../../src/application/handlers/orderEventHandlersRegistry';
import { OrderCreatedEventHandler } from '../../../../src/application/handlers/OrderCreatedEventHandler';
import { OrderCancelledEventHandler } from '../../../../src/application/handlers/OrderCancelledEventHandler';
import { IMessagingChannel } from '../../../../src/core/messaging/IMessagingChannel';

describe('Handlers Registry', () => {
  let mockMessagingChannel: jest.Mocked<IMessagingChannel>;

  beforeEach(() => {
    mockMessagingChannel = {
      sendToQueue: jest.fn()
    };
  });

  describe('getHandler', () => {
    it('should return OrderCreatedEventHandler for order.created event', () => {
      const handler = getHandler('order.created', mockMessagingChannel);
      
      expect(handler).toBeDefined();
      expect(handler).toBeInstanceOf(OrderCreatedEventHandler);
    });

    it('should return OrderCancelledEventHandler for order.cancelled event', () => {
      const handler = getHandler('order.cancelled', mockMessagingChannel);
      
      expect(handler).toBeDefined();
      expect(handler).toBeInstanceOf(OrderCancelledEventHandler);
    });

    it('should return null for unknown event type', () => {
      const handler = getHandler('unknown.event', mockMessagingChannel);
      
      expect(handler).toBeNull();
    });

    it('should initialize OrderCreatedHandler with messaging channel', () => {
      const handler = getHandler('order.created', mockMessagingChannel);
    
      const messagingChannel = (handler as any).messagingChannel;
      expect(messagingChannel).toBe(mockMessagingChannel);
    });
  });
});