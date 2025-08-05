import { OrderCreatedEventHandler } from '../../../../src/application/handlers/OrderCreatedEventHandler';
import { config } from '../../../../src/config';
import { CreateOrderDTO } from '../../../../src/core/dtos/CreateOrderDTO';
import { ILogger } from '../../../../src/core/logger/ILogger';
import { IMessagingChannel } from '../../../../src/core/messaging/IMessagingChannel';
import { IOrderRepository } from '../../../../src/core/repositories/IOrderRepository';

describe('OrderCreatedEventHandler', () => {
  let handler: OrderCreatedEventHandler;
  let mockLogger: jest.Mocked<ILogger>;
  let mockRepo: jest.Mocked<IOrderRepository>;
  let mockMessagingChannel: jest.Mocked<IMessagingChannel>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    mockRepo = {
      save: jest.fn(),
    };

    mockMessagingChannel = {
      sendToQueue: jest.fn()
    };

    handler = new OrderCreatedEventHandler(
      mockMessagingChannel,
      mockLogger,
      mockRepo
    );
  });

  const validPayload = {
    customer_email: 'test@example.com',
    total_amount: 100,
  };

  describe('handle', () => {
    it('should save order and send to CRM queue', async () => {
      await handler.handle(validPayload);

      // Verify order was saved
      expect(mockRepo.save).toHaveBeenCalledWith({
        customer_email: validPayload.customer_email,
        total_amount: validPayload.total_amount,
      });

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[order.created] Order saved:',
        expect.objectContaining<CreateOrderDTO>({
          customer_email: validPayload.customer_email,
          total_amount: validPayload.total_amount,
        })
      );

      // Verify CRM message was sent
      expect(mockMessagingChannel.sendToQueue).toHaveBeenCalledWith(
        config.rabbitmq.crmQueue,
        expect.any(Buffer),
        { persistent: true }
      );

      // Capture the buffer that was passed to sendToQueue
      const [_, buffer] = mockMessagingChannel.sendToQueue.mock.calls[0];
      
      // Parse and verify buffer content
      const actualPayload = JSON.parse(buffer.toString());
      expect(actualPayload).toEqual({
        email: validPayload.customer_email,
        amount: validPayload.total_amount,
        timestamp: expect.any(String)
      });

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith('CRM event enqueued');
    });
  });
});