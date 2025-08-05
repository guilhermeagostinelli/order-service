import dotenv from 'dotenv';
dotenv.config();

export const config = {
  rabbitmq: {
    url: process.env.RABBITMQ_URL!,
    orderQueue: process.env.RABBITMQ_ORDER_QUEUE!,
    crmQueue: process.env.RABBITMQ_CRM_QUEUE!,
    crmDLQ: process.env.RABBITMQ_CRM_DEAD_LETTER_QUEUE!
  },
  database: {
    url: process.env.DATABASE_URL!
  },
  batches: {
    maxSize: 5,
    flushIntervalMs: 10000
  },
  maxRetries: 3
};