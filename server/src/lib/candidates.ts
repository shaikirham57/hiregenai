import { prisma } from "../db.js";

const AVATAR_COLORS = [
  "#0053FE", "#6E1EEE", "#14296B", "#1F9D55", "#D9A404",
  "#0A1D50", "#8A47F2", "#2E71FE", "#D92D20", "#5B6472",
];
function colorForSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export interface CreateCandidateInput {
  name: string;
  email: string;
  location: string;
  appliedJobId: string;
  skills: string[];
  education: string;
  employmentHistory: unknown;
  certifications: string[];
  resumeFileName: string;
  resumeFileId?: string | null;
  screening?: unknown;
  summaryBullets: string[];
  fitScore: unknown;
  authenticity: { status: "authentic" | "suspicious" | "high_risk"; score: number };
  riskLevel: "low" | "medium" | "high";
  riskFlags: unknown;
  languageTag: string;
  stage: "applied" | "screened" | "interview" | "offer" | "hired" | "rejected";
  appliedAt: string;
}

/**
 * Creates a Candidate record from a submitted application, so a candidate who
 * applies through the self-service portal shows up in the exact same
 * Candidates / Candidate Ranking / Pipeline views recruiters already use.
 */
export async function createCandidateFromApplication(input: CreateCandidateInput) {
  const id = `cand-live-${Date.now()}`;
  return prisma.candidate.create({
    data: {
      id,
      name: input.name,
      email: input.email,
      location: input.location,
      appliedJobId: input.appliedJobId,
      avatarColor: colorForSeed(id),
      skills: input.skills,
      education: input.education,
      employmentHistory: input.employmentHistory as object,
      certifications: input.certifications,
      resumeFileName: input.resumeFileName,
      resumeFileId: input.resumeFileId ?? null,
      screening: input.screening == null ? undefined : (input.screening as object),
      summaryBullets: input.summaryBullets,
      fitScore: input.fitScore as object,
      authenticityStatus: input.authenticity.status,
      authenticityScore: input.authenticity.score,
      riskLevel: input.riskLevel,
      riskFlags: input.riskFlags as object,
      languageTag: input.languageTag,
      stage: input.stage,
      appliedAt: new Date(input.appliedAt),
    },
  });
}
