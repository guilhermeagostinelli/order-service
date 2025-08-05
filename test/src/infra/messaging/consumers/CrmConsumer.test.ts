import { CrmConsumer } from '../../../../../src/infra/messaging/consumers/CrmConsumer';
import { ILogger } from '../../../../../src/core/logger/ILogger';
import { Channel, ConsumeMessage } from 'amqplib';
import { IBatchProcessor } from '../../../../../src/core/batches/IBatchProcessor';
import { config } from '../../../../../src/config';

describe('CrmConsumer', () => {
  let consumer: CrmConsumer;
  let mockLogger: jest.Mocked<ILogger>;
  let mockChannel: jest.Mocked<Channel>;
  let mockProcessor: jest.Mocked<IBatchProcessor>;
  let mockMessage: ConsumeMessage;

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

    mockProcessor = {
      addToBatch: jest.fn()
    };

    mockMessage = {
      content: Buffer.from(JSON.stringify({ test: 'data' }))
    } as ConsumeMessage;

    consumer = new CrmConsumer(mockLogger, mockChannel, mockProcessor);
  });

  it('should start consuming messages from CRM queue', async () => {
    await consumer.start();

    expect(mockChannel.consume).toHaveBeenCalledWith(
      config.rabbitmq.crmQueue,
      expect.any(Function)
    );
  });

  it('should process valid messages and add to batch', async () => {
    mockChannel.consume.mockImplementation(async (queue, callback) => {
      await callback(mockMessage);
      return Promise.resolve({ consumerTag: 'tag' });
    });

    await consumer.start();

    expect(mockProcessor.addToBatch).toHaveBeenCalledWith(
      { test: 'data' },
      expect.any(Object)
    );
  })

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
      'Failed to process CRM message:',
      expect.any(Error)
    );
    expect(mockChannel.nack).toHaveBeenCalledWith(invalidMessage, false, false);
  });

  it('should nack message when processing fails', async () => {
    mockProcessor.addToBatch.mockRejectedValue(new Error('Batch error'));

    mockChannel.consume.mockImplementation(async (queue, callback) => {
      await callback(mockMessage);
      return Promise.resolve({ consumerTag: 'tag' });
    });

    await consumer.start();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to process CRM message:',
      expect.any(Error)
    );
    expect(mockChannel.nack).toHaveBeenCalledWith(mockMessage, false, false);
  });

  it('should handle null messages gracefully', async () => {
    mockChannel.consume.mockImplementation(async (queue, callback) => {
      await callback(null);
      return Promise.resolve({ consumerTag: 'tag' });
    });

    await consumer.start();

    expect(mockProcessor.addToBatch).not.toHaveBeenCalled();
    expect(mockChannel.ack).not.toHaveBeenCalled();
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });
});