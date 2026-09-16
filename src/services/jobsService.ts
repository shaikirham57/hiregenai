import type { Job } from "@/types";
import { api } from "@/lib/api";

export async function getJobs(): Promise<Job[]> {
  return api.get<Job[]>("/jobs");
}

export async function getJobById(id: string): Promise<Job | undefined> {
  try {
    return await api.get<Job>(`/jobs/${id}`);
  } catch {
    return undefined;
  }
}

export async function createJob(job: Omit<Job, "id" | "applicantCount">): Promise<Job> {
  return api.post<Job>("/jobs", job);
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<Job | undefined> {
  try {
    return await api.patch<Job>(`/jobs/${id}`, patch);
  } catch {
    return undefined;
  }
}
