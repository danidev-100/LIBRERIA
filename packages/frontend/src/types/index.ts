export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface Product {
  code: string;
  description: string;
  price: number;
  lastUpdate: string | null;
  isActive: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "CLIENT";
  createdAt?: string;
}

export interface OrderItem {
  id: number;
  orderId?: number;
  productCode: string;
  quantity: number;
  unitPrice: number;
  details?: string | null;
  product: Product;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  user?: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserResponse {
  user: User;
}

export interface OrderResponse {
  order: Order;
}

export interface ProductResponse {
  product: Product;
}

export interface DeactivateProductResponse {
  product: Product;
  deactivated: boolean;
}

export interface UploadResultResponse {
  inserted: number;
  updated: number;
  total: number;
  errors: string[];
}
