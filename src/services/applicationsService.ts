import type { Application, ApplicantPersonalInfo, ApplicantBackground, ScreeningAnswer, Job } from "@/types";
import { api } from "@/lib/api";

export async function getApplicationsByCandidateId(candidateId: string): Promise<Application[]> {
  return api.get<Application[]>(`/applications/candidate/${candidateId}`);
}

export async function getApplicationById(id: string): Promise<Application | undefined> {
  try {
    return await api.get<Application>(`/applications/${id}`);
  } catch {
    return undefined;
  }
}

export async function hasAppliedToJob(candidateId: string, jobId: string): Promise<boolean> {
  const result = await api.get<{ hasApplied: boolean }>(
    `/applications/has-applied?candidateId=${encodeURIComponent(candidateId)}&jobId=${encodeURIComponent(jobId)}`
  );
  return result.hasApplied;
}

export interface ApplicationSubmission {
  job: Job;
  personalInfo: ApplicantPersonalInfo;
  background: ApplicantBackground;
  screeningAnswers: ScreeningAnswer[];
  resumeFileId: string;
}

/**
 * Submits a candidate application. The backend creates both the Candidate
 * record (so the applicant appears in recruiter Candidates/Ranking/Pipeline
 * views) and the Application record (tracked under "My Applications") in a
 * single request, sharing the same computed AI Fit Score.
 */
export async function applyToJob(candidateUserId: string, submission: ApplicationSubmission): Promise<Application> {
  void candidateUserId;
  const { job, personalInfo, background, screeningAnswers, resumeFileId } = submission;
  return api.post<Application>("/applications", {
    jobId: job.id,
    personalInfo,
    background,
    screeningAnswers,
    resumeFileId,
  });
}
