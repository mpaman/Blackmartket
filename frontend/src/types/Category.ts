import type { Product } from "./Product";

export interface Category {
  ID: number;
  name: string;
  products: Product;
}