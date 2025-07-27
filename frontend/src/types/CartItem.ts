import type { Product } from "./Product";

export interface CartItem {
  ID: number;
  cart_id: number;
  product_id: number;
  product: Product;
  quantity: number;
  price?: number; // fallback price if needed
}
