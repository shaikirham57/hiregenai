import type { Application, ApplicantPersonalInfo, ApplicantBackground, ScreeningAnswer, Job } from "@/types";
import { api } from "@/lib/api";

export async function getApplicationsByCandidateId(candidateId: string): Promise<Application[]> {
  return api.get<Application[]>(`/applications/candidate/${candidateId}`);
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
