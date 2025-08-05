import { ICrmApi } from "../../core/api/ICrmApi";

export class CrmApi implements ICrmApi {
  async send(payload: any): Promise<void> {
    // Uncomment to simulate CRM API failure:
    // if (Math.random() < 0.2)
    //   throw new Error('Random fake CRM API failure');
  }
}