
import { CartItem } from "@/types/CartItem";
export interface CheckoutData {
  cart_items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
  };
}
