import type { Candidate, PipelineStage } from "@/types";
import { api } from "@/lib/api";

export async function createCandidate(input: Omit<Candidate, "id" | "avatarColor">): Promise<Candidate> {
  return api.post<Candidate>("/candidates", input);
}

export async function getCandidates(): Promise<Candidate[]> {
  return api.get<Candidate[]>("/candidates");
}

export async function getCandidateById(id: string): Promise<Candidate | undefined> {
  try {
    return await api.get<Candidate>(`/candidates/${id}`);
  } catch {
    return undefined;
  }
}

export async function getCandidatesByJobId(jobId: string): Promise<Candidate[]> {
  return api.get<Candidate[]>(`/candidates/job/${jobId}`);
}

export async function updateCandidateStage(id: string, stage: PipelineStage): Promise<Candidate | undefined> {
  try {
    return await api.patch<Candidate>(`/candidates/${id}/stage`, { stage });
  } catch {
    return undefined;
  }
}

export async function searchCandidates(query: string, mode: "keyword" | "semantic"): Promise<Candidate[]> {
  void mode;
  return api.get<Candidate[]>(`/candidates/search?q=${encodeURIComponent(query)}`);
}
