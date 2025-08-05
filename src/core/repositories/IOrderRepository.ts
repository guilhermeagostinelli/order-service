import { CreateOrderDTO } from "../dtos/CreateOrderDTO";

export interface IOrderRepository {
  save(order: CreateOrderDTO): Promise<void>;
}