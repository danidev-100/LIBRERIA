import { client } from "./client.js";
import type { ProductsResponse, ProductResponse } from "../types/index.js";

export function getProducts(
  search?: string,
  page?: number,
  limit?: number,
): Promise<ProductsResponse> {
  return client.get<ProductsResponse>("/products", { search, page, limit });
}

export function getProduct(code: string): Promise<ProductResponse> {
  return client.get<ProductResponse>(`/products/${encodeURIComponent(code)}`);
}
