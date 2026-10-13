import type { ResumeUploadJob } from "@/types";
import { sleep } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { extractResumeText, ResumeReadError } from "@/lib/resumeText";

interface ResumeAnalysis {
  candidateName: string;
  extractedSkills: string[];
  extractedEducation: string;
  extractedExperienceYears: number;
  matchScore?: number;
  matchedSkills?: string[];
}

export interface ScreenResumeOptions {
  jobId?: string;
  fileSize?: number;
}

function toCandidateName(fileName: string): string {
  const base = fileName.replace(/\.[^./]+$/, "");
  const cleaned = base
    .replace(/[_\-.]+/g, " ")
    .replace(/\b(resume|cv)\b/gi, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Unknown Candidate";
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

/**
 * Drives the multi-stage upload progress UI client-side (unchanged UX), then
 * calls the backend for the deterministic "extraction" result that used to be
 * computed locally — same algorithm, now real server logic.
 */
export async function screenResume(
  fileName: string,
  onUpdate: (job: ResumeUploadJob) => void,
  options?: ScreenResumeOptions
): Promise<ResumeUploadJob> {
  const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const isUnsupported = !/\.(pdf|docx?)$/i.test(fileName);
  const candidateName = toCandidateName(fileName);

  let job: ResumeUploadJob = {
    id,
    fileName,
    stage: "uploading",
    progress: 10,
    fileSize: options?.fileSize,
    candidateName,
    jobId: options?.jobId,
  };
  onUpdate(job);
  await sleep(450);

  if (isUnsupported) {
    job = { ...job, stage: "error", progress: 10, errorMessage: "Unsupported file type. Please upload a PDF or DOCX resume." };
    onUpdate(job);
    return job;
  }

  job = { ...job, stage: "extracting", progress: 45 };
  onUpdate(job);
  await sleep(800);

  job = { ...job, stage: "vectorizing", progress: 80 };
  onUpdate(job);
  await sleep(650);

  const analysis = await api.post<ResumeAnalysis>("/ai/resume/analyze", { fileName, jobId: options?.jobId });

  job = {
    ...job,
    stage: "done",
    progress: 100,
    candidateName: analysis.candidateName,
    extractedSkills: analysis.extractedSkills,
    extractedEducation: analysis.extractedEducation,
    extractedExperienceYears: analysis.extractedExperienceYears,
    matchScore: analysis.matchScore,
    matchedSkills: analysis.matchedSkills,
  };
  onUpdate(job);
  return job;
}

export interface ResumeScreeningResult {
  candidateName: string;
  extractedSkills: string[];
  extractedEducation: string;
  extractedExperienceYears: number;
  requirements: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
  scoreBreakdown: { skills: number; experience: number; education: number };
  narrative: string;
}

export type ScreenedResume = ResumeUploadJob & { missingSkills?: string[] };

/**
 * Screens a real resume file against a recruiter-created job: reads the file's
 * text in the browser, then the API scores it against that job's description,
 * required skills, seniority, and scoring weights from the database.
 * Progress stages reflect the actual work being done.
 */
export async function screenResumeFile(
  file: File,
  jobId: string,
  onUpdate: (job: ScreenedResume) => void
): Promise<ScreenedResume> {
  let job: ScreenedResume = {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    stage: "uploading",
    progress: 10,
    fileSize: file.size,
    jobId,
  };
  onUpdate(job);

  try {
    job = { ...job, stage: "extracting", progress: 40 };
    onUpdate(job);
    const text = await extractResumeText(file);

    job = { ...job, stage: "vectorizing", progress: 75 };
    onUpdate(job);
    const result = await api.post<ResumeScreeningResult>("/ai/resume/screen", { jobId, fileName: file.name, text });

    job = {
      ...job,
      stage: "done",
      progress: 100,
      candidateName: result.candidateName,
      extractedSkills: result.extractedSkills,
      extractedEducation: result.extractedEducation,
      extractedExperienceYears: result.extractedExperienceYears,
      matchScore: result.matchScore,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
    };
  } catch (err) {
    const message =
      err instanceof ResumeReadError || err instanceof ApiError ? err.message : "Screening failed. Check your connection and retry.";
    job = { ...job, stage: "error", errorMessage: message };
  }
  onUpdate(job);
  return job;
}
