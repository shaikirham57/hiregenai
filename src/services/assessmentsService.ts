import type { Assessment, AssessmentResult } from "@/types";
import { api } from "@/lib/api";

export async function getAssessments(): Promise<Assessment[]> {
  return api.get<Assessment[]>("/assessments");
}

export async function getAssessmentById(id: string): Promise<Assessment | undefined> {
  try {
    return await api.get<Assessment>(`/assessments/${id}`);
  } catch {
    return undefined;
  }
}

export async function getResultsByAssessmentId(assessmentId: string): Promise<AssessmentResult[]> {
  return api.get<AssessmentResult[]>(`/assessments/${assessmentId}/results`);
}

export async function getAssessmentsByJobId(jobId: string): Promise<Assessment[]> {
  return api.get<Assessment[]>(`/assessments/job/${jobId}`);
}
