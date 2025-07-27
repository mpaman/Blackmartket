import type { Category } from "./Category";
import type { ProductImage } from "./ProductImage";
import type { User } from "./User";
export interface Product {
  ID: number;
  name: string;
  description: string;
  price: number;
  images: ProductImage[];
  category_id: number;
  category?: Category;
  user_id: number;
  user?: User;
}
