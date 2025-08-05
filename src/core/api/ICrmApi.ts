export interface ICrmApi {
  send(payload: any): Promise<void>;
}