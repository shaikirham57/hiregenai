import { z } from "zod";
import { fitScoreSchema } from "./common.schemas.js";

export const applySchema = z.object({
  jobId: z.string(),
  personalInfo: z.record(z.string(), z.any()),
  background: z.record(z.string(), z.any()),
  screeningAnswers: z.array(z.any()),
  // The stored resume (POST /api/resumes) this application is submitted with.
  resumeFileId: z.string().min(1),
  // Legacy fields from older clients. The server now derives these from the stored resume.
  resumeFileName: z.string().optional(),
  extractedSkills: z.array(z.string()).optional(),
  fitScore: fitScoreSchema.optional(),
});
