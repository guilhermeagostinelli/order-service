export interface CreateOrderDTO {
  customer_email: string;
  total_amount: number;
  created_at?: Date;
}