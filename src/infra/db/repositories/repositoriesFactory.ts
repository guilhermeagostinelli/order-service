
import { IOrderRepository } from "../../../core/repositories/IOrderRepository";
import { PostgresOrderRepository } from "./PostgresOrderRepository";

export function createOrderRepository(): IOrderRepository {
  return new PostgresOrderRepository();
}