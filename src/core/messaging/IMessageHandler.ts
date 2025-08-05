export interface IMessageHandler {
  acknowledge(): void;
  reject(): void;
}