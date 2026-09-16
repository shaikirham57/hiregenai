import type { User, UserRole } from "@/types";
import { api } from "@/lib/api";

export async function login(email: string, password: string, role: UserRole): Promise<User> {
  return api.post<User>("/auth/login", { email, password, role });
}

export async function register(name: string, email: string, password: string, role: UserRole): Promise<User> {
  return api.post<User>("/auth/register", { name, email, password, role });
}

export async function logout(): Promise<void> {
  await api.post<void>("/auth/logout");
}
