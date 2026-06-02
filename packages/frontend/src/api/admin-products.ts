import { client } from "./client.js";
import type {
  ProductsResponse,
  ProductResponse,
  DeactivateProductResponse,
  UploadResultResponse,
} from "../types/index.js";

export interface CreateProductData {
  code: string;
  description: string;
  price: number;
  category?: string;
}

export interface UpdateProductData {
  description?: string;
  price?: number;
  category?: string;
  isActive?: boolean;
}

export function adminGetProducts(
  search?: string,
  isActive?: string,
  page?: number,
  limit?: number,
): Promise<ProductsResponse> {
  return client.get<ProductsResponse>("/admin/products", {
    search,
    isActive,
    page,
    limit,
  });
}

export function adminCreateProduct(
  data: CreateProductData,
): Promise<ProductResponse> {
  return client.post<ProductResponse>("/admin/products", data);
}

export function adminUpdateProduct(
  code: string,
  data: UpdateProductData,
): Promise<ProductResponse> {
  return client.put<ProductResponse>(`/admin/products/${encodeURIComponent(code)}`, data);
}

export function adminDeactivateProduct(
  code: string,
): Promise<DeactivateProductResponse> {
  return client.del<DeactivateProductResponse>(`/admin/products/${encodeURIComponent(code)}`);
}

export function adminUploadProductList(
  file: File,
): Promise<UploadResultResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return client.postFormData<UploadResultResponse>("/admin/products/upload", formData);
}
