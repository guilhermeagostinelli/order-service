import { Channel, ConsumeMessage } from "amqplib";
import { IOrderEventHandler } from "../../../../../src/application/handlers/IOrderEventHandler";
import * as handlersRegistry from "../../../../../src/application/handlers/orderEventHandlersRegistry";
import { ILogger } from "../../../../../src/core/logger/ILogger";
import { OrderEvent } from "../../../../../src/core/messaging/OrderEvent";
import { OrderConsumer } from "../../../../../src/infra/messaging/consumers/OrderConsumer";
import { config } from "../../../../../src/config";

describe('OrderConsumer', () => {
  let mockMessage: ConsumeMessage;
  let mockLogger: jest.Mocked<ILogger>;
  let mockChannel: jest.Mocked<Channel>;
  let mockHandler: jest.Mocked<IOrderEventHandler>;
  let consumer: OrderConsumer;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    mockChannel = {
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn()
    } as any;

    mockHandler = {
      handle: jest.fn()
    };

    mockMessage = {
      content: Buffer.from(JSON.stringify({
        type: 'order.created',
        payload: { id: '123' }
      }))
    } as ConsumeMessage;

    consumer = new OrderConsumer(mockLogger, mockChannel);
  });

  it('should start consuming messages from order queue', async () => {
    await consumer.start();

    expect(mockChannel.consume).toHaveBeenCalledWith(
      config.rabbitmq.orderQueue,
      expect.any(Function)
    );
  });

  it('should process message and acknowledge when handler exists', async () => {
    jest.spyOn(handlersRegistry, 'getHandler').mockReturnValue(mockHandler);

    // Set up channel.consume to call the callback
    mockChannel.consume.mockImplementation(async (queue, callback) => {
      await callback(mockMessage);
      return Promise.resolve({ consumerTag: 'tag' });
    });

    await consumer.start();

    const expectedEvent: OrderEvent = {
      type: 'order.created',
      payload: { id: '123' }
    };

    expect(handlersRegistry.getHandler).toHaveBeenCalledWith(
      expectedEvent.type,
      mockChannel
    );
    expect(mockHandler.handle).toHaveBeenCalledWith(expectedEvent.payload);
    expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
  });

  it('should nack message when no handler exists', async () => {
    jest.spyOn(handlersRegistry, 'getHandler').mockReturnValue(null);

    mockChannel.consume.mockImplementation(async (queue, callback) => {
      await callback(mockMessage);
      return Promise.resolve({ consumerTag: 'tag' });
    });

    await consumer.start();

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'No handler for type order.created'
    );
    expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, false);
    expect(mockHandler.handle).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON messages', async () => {
    const invalidMessage = {
      content: Buffer.from('invalid json')
    } as ConsumeMessage;

    mockChannel.consume.mockImplementation(async (queue, callback) => {
      await callback(invalidMessage);
      return Promise.resolve({ consumerTag: 'tag' });
    });

    await consumer.start();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to process order message:',
      expect.any(Error)
    );
    expect(mockChannel.nack).toHaveBeenCalledWith(invalidMessage, false, false);
  });

  it('should nack message when processing fails', async () => {
    const error = new Error('Processing failed');
    jest.spyOn(handlersRegistry, 'getHandler').mockImplementation(() => {
      throw error;
    });

    mockChannel.consume.mockImplementation(async (queue, callback) => {
      await callback(mockMessage);
      return Promise.resolve({ consumerTag: 'tag' });
    });

    await consumer.start();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to process order message:',
      error
    );
    expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, false);
  });

  it('should handle null messages gracefully', async () => {
    mockChannel.consume.mockImplementation(async (queue, callback) => {
      await callback(null);
      return Promise.resolve({ consumerTag: 'tag' });
    });

    await consumer.start();

    expect(mockHandler.handle).not.toHaveBeenCalled();
    expect(mockChannel.ack).not.toHaveBeenCalled();
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });
});