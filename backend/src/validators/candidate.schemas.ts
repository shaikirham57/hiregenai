import { z } from "zod";
import { candidateStageSchema, fitScoreSchema } from "./common.schemas.js";

export const candidateCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  location: z.string().min(1),
  appliedJobId: z.string(),
  skills: z.array(z.string()),
  education: z.string(),
  employmentHistory: z.array(z.any()),
  certifications: z.array(z.string()),
  resumeFileName: z.string(),
  summaryBullets: z.array(z.string()),
  fitScore: fitScoreSchema,
  authenticity: z.object({ status: z.enum(["authentic", "suspicious", "high_risk"]), score: z.number() }),
  riskLevel: z.enum(["low", "medium", "high"]),
  riskFlags: z.array(z.any()),
  languageTag: z.string(),
  stage: candidateStageSchema,
  appliedAt: z.string(),
});

export const stageSchema = z.object({ stage: candidateStageSchema });

export const attachResumeSchema = z.object({ resumeFileId: z.string().min(1) });
