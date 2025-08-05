export interface IOrderEventHandler {
  handle(payload: any): Promise<void>;
}
