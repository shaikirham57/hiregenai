import type { FitScoreBreakdown, Job } from "@/types";
import { api } from "@/lib/api";

export interface ScoringInput {
  skills: string[];
  yearsExperience: number;
  education: string;
}

/**
 * AI fit-score scoring, now computed server-side. The function signature and
 * return type are unchanged so every existing caller (Ranking/Candidate views,
 * apply flows) keeps working without modification.
 */
export async function scoreCandidateAgainstJob(input: ScoringInput, job: Job): Promise<FitScoreBreakdown> {
  return api.post<FitScoreBreakdown>("/ai/score", { ...input, jobId: job.id });
}
