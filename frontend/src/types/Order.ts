import type { OrderItem } from "./OrderItem";
import type { Address } from "./Address";

export interface Order {
  ID: number;
  user_id: number;
  status: string;
  total_price: number;
  address_id: number;
  address?: Address;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  
}
