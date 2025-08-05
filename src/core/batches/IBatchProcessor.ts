import { IMessageHandler } from "../messaging/IMessageHandler";

export interface IBatchProcessor {
  addToBatch(payload: any, messageHandler: IMessageHandler): Promise<void>;
}