import type { Product } from "./Product";

export interface OrderItem {
  ID: number;
  order_id: number;
  product_id: number;
  quantity: number;
  product?: Product;
}
