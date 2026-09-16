import type { Notification, UserRole } from "@/types";
import { api } from "@/lib/api";

export async function getNotifications(role: UserRole): Promise<Notification[]> {
  return api.get<Notification[]>(`/notifications?role=${role}`);
}

export async function markAsRead(role: UserRole, id: string): Promise<void> {
  void role;
  await api.patch<void>(`/notifications/${id}/read`);
}

export async function markAllAsRead(role: UserRole): Promise<void> {
  await api.post<void>("/notifications/mark-all-read", { role });
}
