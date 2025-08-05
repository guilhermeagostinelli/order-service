import { pool } from '../postgres';
import { CreateOrderDTO } from '../../../core/dtos/CreateOrderDTO';
import { IOrderRepository } from '../../../core/repositories/IOrderRepository';

export class PostgresOrderRepository implements IOrderRepository {
  async save(order: CreateOrderDTO): Promise<void> {
    const query = `
      INSERT INTO orders (customer_email, total_amount, created_at)
      VALUES ($1, $2, $3)
    `;

    await pool.query(query, [
      order.customer_email,
      order.total_amount,
      order.created_at || new Date()
    ]);
  }
}
