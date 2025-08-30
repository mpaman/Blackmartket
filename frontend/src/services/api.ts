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

export const getProductById = (id: number) =>
  axios.get<Product>(`${apiUrl}/products/${id}`);

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

export const getAllCategories = () =>
  axios.get<Category[]>(`${apiUrl}/categories`);

// ใช้ GetUserProducts จาก backend
export const GetUserProducts = async (): Promise<{ data: Product[] }> => {
  try {
    console.log("Calling GetUserProducts API...");
    const response = await axios.get<Product[]>(
      `${apiUrl}/api/user/products`,
      authHeader()
    );
    console.log("GetUserProducts response:", response.data);
    return { data: response.data || [] };
  } catch (error) {
    console.error("GetUserProducts error:", error);
    throw error;
  }
};

// ใช้ updateProduct จาก backend
export const updateProduct = async (
  id: number,
  data: {
    name: string;
    description: string;
    price: number;
    category_id: number;
    images: Array<{
      url: string;
      alt?: string;
    }>;
  }
) => {
  try {
    console.log("Updating product with ID:", id, "Data:", data);
    return await axios.put(`${apiUrl}/api/products/${id}`, data, authHeader());
  } catch (error) {
    console.error("updateProduct error:", error);
    throw error;
  }
};

// ใช้ deleteProduct จาก backend
export const deleteProduct = async (id: number) => {
  try {
    console.log("Deleting product with ID:", id);
    return await axios.delete(`${apiUrl}/api/products/${id}`, authHeader());
  } catch (error) {
    console.error("deleteProduct error:", error);
    throw error;
  }
};

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

export const updateUserProfile = (data: {
  name: string;
  email: string;
  profile_image_url?: string;
  phone?: string;
  address?: string;
}) => axios.put(`${apiUrl}/api/update-profile`, data, authHeader());

export const changePassword = (data: {
  current_password: string;
  new_password: string;
}) => axios.put(`${apiUrl}/api/change-password`, data, authHeader());

export const GetUserAddresses = () =>
  axios.get(`${apiUrl}/api/addresses`, authHeader());

// Checkout APIs
export const getCheckoutSession = () =>
  axios.get(`${apiUrl}/api/checkout`, authHeader());

export const processCheckout = (data: {
  shipping_address: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    is_default: boolean;
  };
  payment_method: string;
}) =>
  axios.post(`${apiUrl}/api/checkout`, data, authHeader());

export const getOrderStatus = (orderId: number) =>
  axios.get(`${apiUrl}/api/checkout/order/${orderId}`, authHeader());

export const getUserOrders = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${apiUrl}/api/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getOrderById = async (orderId: string) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${apiUrl}/api/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

