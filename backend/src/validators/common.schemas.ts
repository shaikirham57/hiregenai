import { z } from "zod";

export const roleSchema = z.enum(["recruiter", "candidate"]);

export const candidateStageSchema = z.enum(["applied", "screened", "interview", "offer", "hired", "rejected"]);

export const fitScoreSchema = z.object({
  overall: z.number(),
  skills: z.number(),
  experience: z.number(),
  education: z.number(),
  confidence: z.enum(["high", "low"]),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  narrative: z.string(),
});
