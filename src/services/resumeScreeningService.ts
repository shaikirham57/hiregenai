import type { ResumeUploadJob } from "@/types";
import { sleep } from "@/lib/utils";
import { api } from "@/lib/api";

export interface ScreeningJobOption {
  id: string;
  title: string;
  skills: string[];
}

export const JOB_OPTIONS: ScreeningJobOption[] = [
  {
    id: "ai-engineer",
    title: "AI Engineer",
    skills: ["Python", "Machine Learning", "TensorFlow", "PyTorch", "MLOps", "AWS", "Docker"],
  },
  {
    id: "genai-engineer",
    title: "Generative AI Engineer",
    skills: ["Python", "LLM", "Prompt Engineering", "LangChain", "PyTorch", "RAG", "Vector Databases"],
  },
  {
    id: "python-developer",
    title: "Python Developer",
    skills: ["Python", "Django", "Flask", "REST APIs", "PostgreSQL", "Docker", "Git"],
  },
  {
    id: "java-developer",
    title: "Java Developer",
    skills: ["Java", "Spring Boot", "Microservices", "REST APIs", "SQL", "Kubernetes", "Git"],
  },
];

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
