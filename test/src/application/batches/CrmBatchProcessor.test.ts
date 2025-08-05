import { CrmBatchProcessor } from '../../../../src/application/batches/CrmBatchProcessor';
import { ILogger } from '../../../../src/core/logger/ILogger';
import { IMessageHandler } from '../../../../src/core/messaging/IMessageHandler';
import { ICrmApi } from '../../../../src/core/api/ICrmApi';
import { config } from '../../../../src/config';

describe('CrmBatchProcessor', () => {
  let processor: CrmBatchProcessor;
  let mockLogger: jest.Mocked<ILogger>;
  let mockMessageHandler: jest.Mocked<IMessageHandler>;
  let mockCrmApi: jest.Mocked<ICrmApi>;
  
  beforeEach(() => {
    jest.useFakeTimers();
    
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    mockMessageHandler = {
      acknowledge: jest.fn(),
      reject: jest.fn()
    };

    mockCrmApi = {
      send: jest.fn().mockResolvedValue(undefined)
    };

    processor = new (CrmBatchProcessor as any)(mockLogger, mockCrmApi);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = CrmBatchProcessor.getInstance(mockLogger, mockCrmApi);
    const instance2 = CrmBatchProcessor.getInstance(mockLogger, mockCrmApi);
    expect(instance1).toBe(instance2);
  });

  it('should add payload to batch', async () => {
    const payload = { test: 'data' };
    await processor.addToBatch(payload, mockMessageHandler);
    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockCrmApi.send).not.toHaveBeenCalled();
  });

  it('should flush batch when max size is reached', async () => {
    const payload = { test: 'data' };
    
    for (let i = 0; i < config.batches.maxSize; i++) {
      await processor.addToBatch(payload, mockMessageHandler);
    }

    expect(mockCrmApi.send).toHaveBeenCalledWith(payload);
    expect(mockLogger.info).toHaveBeenCalledWith('Data sent to CRM API:', payload);
    expect(mockMessageHandler.acknowledge).toHaveBeenCalled();
  });

  it('should retry failed messages with exponential backoff and send to DLQ after max retries', async () => {
    const payload = { test: 'data' };

    mockCrmApi.send.mockRejectedValue(new Error('API Error'));

    await processor.addToBatch(payload, mockMessageHandler);
    await (processor as any).flush();

    for (let retryCount = 0; retryCount < config.maxRetries; retryCount++) {
      jest.advanceTimersByTime(Math.pow(2, retryCount) * 1000);
      await Promise.resolve();
      await (processor as any).flush();
    }

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Failed to send data to CRM API:',
      expect.any(Error),
      { test: 'data' }
    );
    expect(mockCrmApi.send).toHaveBeenCalledTimes(config.maxRetries + 1); // initial + retries
    expect(mockLogger.warn).toHaveBeenCalledTimes(config.maxRetries + 1); // initial + retries
    expect(mockLogger.error).toHaveBeenCalledWith('Max retries reached. Sending to DLQ:', payload);
    expect(mockMessageHandler.reject).toHaveBeenCalled();
  });

  it('should flush automatically after interval', async () => {
    const payload = { test: 'data' };
    await processor.addToBatch(payload, mockMessageHandler);
    
    jest.advanceTimersByTime(config.batches.flushIntervalMs);
    await Promise.resolve();
    await Promise.resolve();
    
    expect(mockCrmApi.send).toHaveBeenCalledWith(payload);
    expect(mockLogger.info).toHaveBeenCalledWith('Data sent to CRM API:', payload);
    expect(mockMessageHandler.acknowledge).toHaveBeenCalled();
  });

  it('should log retry attempts', async () => {
    const payload = { test: 'data' };
    const entry = { payload, retryCount: 2, messageHandler: mockMessageHandler };
    
    await (processor as any).sendToCrmAPI(entry);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      `Retrying to send data to CRM API (2/${config.maxRetries}):`, 
      payload
    );
  });
});