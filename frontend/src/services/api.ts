import axios from "axios";
import type { User } from "@/types/User";
import type { Product } from "@/types/Product";
import type { Category } from "@/types/Category";
import type { Cart } from "@/types/Cart";

const apiUrl = "http://localhost:8000";

const authHeader = () => {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";
  return token ? { headers: { Authorization: `${tokenType} ${token}` } } : {};
};

export const isLoggedIn = (): boolean => {
  const token = localStorage.getItem("token");
  return !!token;
};

export const logout = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_profile_image");
  window.location.reload();
};

export async function SignIn(data: { email: string; password: string }) {
  const response = await axios.post(`${apiUrl}/signin`, data);
  if (!response.data) {
    throw new Error("Invalid response from server");
  }
  return response;
}

export async function Signup(data: User) {
  const response = await axios.post(`${apiUrl}/signup`, data);
  if (!response.data) {
    throw new Error("Invalid response from server");
  }
  return response;
}

export const getRootStatus = () => axios.get(`${apiUrl}/`);

export const getAllProducts = () => axios.get<Product[]>(`${apiUrl}/products`);

export const getProductById = (id: number) =>
  axios.get<Product>(`${apiUrl}/products/${id}`);

export const getAllCategories = () =>
  axios.get<Category[]>(`${apiUrl}/categories`);

export const getCategories = () =>
  axios.get<Category[]>(`${apiUrl}/categories`);

export const createCategory = (data: { Name: string }) =>
  axios.post(`${apiUrl}/categories`, data, authHeader());

export const createProduct = (data: {
  name: string;
  description: string;
  price: number;
  category_id: number;
  images: Array<{
    url: string;
    alt?: string;
  }>;
}) => {
  console.log("Creating product with data:", data);
  return axios.post(`${apiUrl}/api/products`, data, authHeader());
};

export const deleteProduct = (id: number) =>
  axios.delete(`${apiUrl}/api/products/${id}`, authHeader());

export const getUserCart = () =>
  axios.get<Cart>(`${apiUrl}/api/cart`, authHeader());

export const getCartCount = () =>
  axios.get<{ count: number }>(`${apiUrl}/api/cart/count`, authHeader());

export const addToCart = (data: { product_id: number; quantity: number }) => {
  console.log("Adding to cart with data:", data);
  return axios.post(`${apiUrl}/api/cart`, data, authHeader());
};

export const updateCartItem = (data: {
  product_id: number;
  quantity: number;
}) => {
  console.log("Updating cart item with data:", data);
  return axios.put(`${apiUrl}/api/cart`, data, authHeader());
};

export const removeCartItem = (productId: number) =>
  axios.delete(`${apiUrl}/api/cart/item/${productId}`, authHeader());

export const deleteCart = () =>
  axios.delete(`${apiUrl}/api/cart`, authHeader());

export const getCurrentUser = () =>
  axios.get(`${apiUrl}/api/current-user`, authHeader());

export const updateProfileImage = (data: { profile_image_url: string }) =>
  axios.put(`${apiUrl}/api/update-profile-image`, data, authHeader());
