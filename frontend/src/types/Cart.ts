import type { CartItem } from "./CartItem";
import { Product } from "./Product";
import { User } from "./User";

export interface Cart {
  ID: number;
  user_id: number;
  user?: User;
  items: CartItem[];
  product?: Product;
}
