import { Address } from "./Address";
import { Order } from "./Order";

export interface User {
  ID: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string | Address; // Can be string for signup or Address object for other operations
  order?: Order[];
  profile_image_url?: string;
}
