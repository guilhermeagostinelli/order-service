import { OrderCancelledEventHandler } from '../../../../src/application/handlers/OrderCancelledEventHandler';
import { ILogger } from '../../../../src/core/logger/ILogger';

describe('OrderCancelledEventHandler', () => {
  let handler: OrderCancelledEventHandler;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    handler = new OrderCancelledEventHandler(mockLogger);
  });

  it('should log info message when handling cancelled order', async () => {
    const payload = { orderId: '123', reason: 'customer_request' };
    
    await handler.handle(payload);

    expect(mockLogger.info).toHaveBeenCalledWith(
      '[order.cancelled] Order cancelled:',
      payload
    );
  });
});