import type { Interview } from "@/types";
import { api } from "@/lib/api";

export async function getInterviews(): Promise<Interview[]> {
  return api.get<Interview[]>("/interviews");
}

export async function getInterviewById(id: string): Promise<Interview | undefined> {
  try {
    return await api.get<Interview>(`/interviews/${id}`);
  } catch {
    return undefined;
  }
}

export async function getInterviewsByCandidateId(candidateId: string): Promise<Interview[]> {
  return api.get<Interview[]>(`/interviews/candidate/${candidateId}`);
}
