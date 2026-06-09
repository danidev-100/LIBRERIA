import { client } from "./client.js";
import type { AuthResponse, UserResponse } from "../types/index.js";

export function login(email: string, password: string): Promise<AuthResponse> {
  return client.post<AuthResponse>("/auth/login", { email, password });
}

export function register(
  name: string,
  email: string,
  password: string,
  phone?: string,
): Promise<UserResponse> {
  return client.post<UserResponse>("/auth/register", { name, email, password, phone });
}

export function getMe(): Promise<UserResponse> {
  return client.get<UserResponse>("/auth/me");
}
