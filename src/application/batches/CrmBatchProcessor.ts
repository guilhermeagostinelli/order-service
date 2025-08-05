import { config } from "../../config";
import { ICrmApi } from "../../core/api/ICrmApi";
import { IBatchProcessor } from "../../core/batches/IBatchProcessor";
import { ILogger } from "../../core/logger/ILogger";
import { IMessageHandler } from "../../core/messaging/IMessageHandler";
import { createCrmApi } from "../../infra/api/apisFactory";
import { createLogger } from "../../infra/logger/loggerFactory";

type BatchEntry = {
  payload: any;
  retryCount: number;
  messageHandler: IMessageHandler;
};

export class CrmBatchProcessor implements IBatchProcessor {
  private static instance: CrmBatchProcessor;
  private batch: BatchEntry[] = [];
  private timer: NodeJS.Timeout;

  private constructor(
    private readonly logger: ILogger,
    private readonly crmApi: ICrmApi,
  ) {
    this.timer = setInterval(() => this.flush(), config.batches.flushIntervalMs);
  }

  static getInstance(
    logger: ILogger = createLogger(),
    crmApi: ICrmApi = createCrmApi()
  ): CrmBatchProcessor {
    if (!CrmBatchProcessor.instance) {
      CrmBatchProcessor.instance = new CrmBatchProcessor(logger, crmApi);
    }
    return CrmBatchProcessor.instance;
  }

  async addToBatch(payload: any, messageHandler: IMessageHandler) {
    this.batch.push({ payload, retryCount: 0, messageHandler });
    if (this.batch.length >= config.batches.maxSize) {
      await this.flush();
    }
  }

  private async flush() {
    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];

    for (const entry of currentBatch) {
      try {
        await this.sendToCrmAPI(entry);
        // Acknowledge only after successful processing
        entry.messageHandler.acknowledge();
      } catch (err) {
        this.logger.warn('Failed to send data to CRM API:', err, entry.payload);
        if (entry.retryCount < config.maxRetries) {
          setTimeout(() => {
            this.batch.push({ ...entry, retryCount: entry.retryCount + 1 });
          }, this.getExponentialBackoff(entry.retryCount));
        } else {
          this.logger.error('Max retries reached. Sending to DLQ:', entry.payload);
          entry.messageHandler.reject();
        }
      }
    }
  }

  private getExponentialBackoff(retry: number): number {
    return Math.pow(2, retry) * 1000;
  }

  private async sendToCrmAPI(entry: BatchEntry) {
    if (entry.retryCount > 0)
      this.logger.info(`Retrying to send data to CRM API (${entry.retryCount}/${config.maxRetries}):`, entry.payload);
    await this.crmApi.send(entry.payload);
    this.logger.info('Data sent to CRM API:', entry.payload);
  }
}
