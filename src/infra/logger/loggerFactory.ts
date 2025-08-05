import { ILogger } from "../../core/logger/ILogger";
import { WinstonLogger } from "./winston";

export function createLogger(): ILogger {
  return WinstonLogger.getInstance();
}