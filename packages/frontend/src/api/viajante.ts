import { client } from "./client.js";
import type {
  OrdersResponse,
  OrderResponse,
} from "../types/index.js";

export interface ViajanteClient {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface ViajanteClientsResponse {
  clients: ViajanteClient[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateViajanteOrderItem {
  productCode: string;
  quantity: number;
  details?: string;
}

export interface CreateViajanteOrderBody {
  clientId: number;
  items: CreateViajanteOrderItem[];
}

export function getClients(
  page?: number,
  limit?: number,
): Promise<ViajanteClientsResponse> {
  return client.get<ViajanteClientsResponse>("/viajante/clients", { page, limit });
}

export function createOrder(
  body: CreateViajanteOrderBody,
): Promise<OrderResponse> {
  return client.post<OrderResponse>("/viajante/orders", body);
}

export function getOrders(
  page?: number,
  limit?: number,
): Promise<OrdersResponse> {
  return client.get<OrdersResponse>("/viajante/orders", { page, limit });
}

export function getOrderPdfUrl(id: number, inline = false): string {
  const BASE_URL = import.meta.env.VITE_API_URL || "/api";
  const url = `${BASE_URL}/orders/${id}/pdf`;
  return inline ? `${url}?inline=true` : url;
}
