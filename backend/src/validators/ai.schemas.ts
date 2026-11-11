import { z } from "zod";

export const scoreSchema = z.object({
  skills: z.array(z.string()),
  yearsExperience: z.number(),
  education: z.string(),
  jobId: z.string(),
});

export const analyzeSchema = z.object({
  fileName: z.string(),
  jobId: z.string().optional(),
});

export const screenSchema = z.object({
  jobId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  // Text extracted from the resume in the browser (PDF/DOCX), capped well below the JSON body limit.
  text: z.string().max(60000),
});

export const jobDescriptionSchema = z.object({
  title: z.string().min(1).max(120),
  seniority: z.string().max(60),
  skills: z.array(z.string().max(60)).max(30),
  location: z.string().max(120),
  tone: z.enum(["professional", "casual", "concise"]),
});
