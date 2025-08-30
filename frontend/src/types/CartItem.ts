import type { Product } from "./Product";

export interface CartItem {
  ID: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: {
    ID: number;
    name: string; // Changed from title to name
    price: number;
    images?: Array<{
      ID: number;
      url: string; // Changed from image_url to url
    }>;
    category?: {
      ID: number;
      name: string;
    };
  };
}
