import { z } from "zod";

const salaryRangeSchema = z.object({
  min: z.number(),
  mid: z.number(),
  max: z.number(),
  source: z.string(),
  updatedAt: z.string(),
});

const scoringWeightsSchema = z.object({
  skills: z.number(),
  experience: z.number(),
  education: z.number(),
});

const jobBaseSchema = z.object({
  title: z.string().min(1),
  department: z.string().min(1),
  location: z.string().min(1),
  employmentType: z.enum(["Full-time", "Part-time", "Contract"]),
  seniority: z.string().min(1),
  status: z.enum(["draft", "open", "paused", "closed"]),
  description: z.string(),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
  screeningQuestions: z.array(z.string()),
  skills: z.array(z.string()),
  scoringWeights: scoringWeightsSchema,
  salaryRange: salaryRangeSchema,
  openDate: z.string(),
  hiringManager: z.string(),
});

// The frontend Job type treats these lists as optional, and the Create Job form
// never sets them, so a new job defaults them to empty instead of rejecting it.
export const jobCreateSchema = jobBaseSchema.extend({
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  screeningQuestions: z.array(z.string()).default([]),
});

// Built from the base schema (no defaults) so a partial update that omits a
// list leaves the stored value untouched rather than resetting it to [].
export const jobUpdateSchema = jobBaseSchema.partial();
