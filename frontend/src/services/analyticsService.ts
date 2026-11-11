import type { AnalyticsSnapshot } from "@/types";
import { api } from "@/lib/api";

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  return api.get<AnalyticsSnapshot>("/analytics");
}
