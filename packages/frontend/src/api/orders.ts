import { client } from "./client.js";
import type {
  OrdersResponse,
  OrderResponse,
} from "../types/index.js";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface CreateOrderItem {
  productCode: string;
  quantity: number;
  details?: string;
}

export function createOrder(
  items: CreateOrderItem[],
): Promise<OrderResponse> {
  return client.post<OrderResponse>("/orders", { items });
}

export function getOrders(
  page?: number,
  limit?: number,
): Promise<OrdersResponse> {
  return client.get<OrdersResponse>("/orders", { page, limit });
}

export function getOrder(id: number): Promise<OrderResponse> {
  return client.get<OrderResponse>(`/orders/${id}`);
}

export function getOrderPdfUrl(id: number, inline = false): string {
  const url = `${BASE_URL}/orders/${id}/pdf`;
  return inline ? `${url}?inline=true` : url;
}

export function adminGetOrders(
  status?: string,
  page?: number,
  limit?: number,
): Promise<OrdersResponse> {
  return client.get<OrdersResponse>("/admin/orders", { status, page, limit });
}

export function adminUpdateStatus(
  id: number,
  status: string,
): Promise<OrderResponse> {
  return client.patch<OrderResponse>(`/admin/orders/${id}/status`, { status });
}
