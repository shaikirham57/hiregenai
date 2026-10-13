import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { serializeJob } from "../lib/serialize.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const jobsRouter = Router();

const EMPLOYMENT_TYPE_TO_DB: Record<string, "Full_time" | "Part_time" | "Contract"> = {
  "Full-time": "Full_time",
  "Part-time": "Part_time",
  Contract: "Contract",
};

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
const jobCreateSchema = jobBaseSchema.extend({
  responsibilities: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  screeningQuestions: z.array(z.string()).default([]),
});

// Built from the base schema (no defaults) so a partial update that omits a
// list leaves the stored value untouched rather than resetting it to [].
const jobUpdateSchema = jobBaseSchema.partial();

jobsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const jobs = await prisma.job.findMany({ orderBy: { openDate: "desc" } });
    res.json(jobs.map(serializeJob));
  })
);

jobsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job) throw new HttpError(404, "Job not found.");
    res.json(serializeJob(job));
  })
);

jobsRouter.post(
  "/",
  requireAuth,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const input = jobCreateSchema.parse(req.body);
    const job = await prisma.job.create({
      data: {
        ...input,
        employmentType: EMPLOYMENT_TYPE_TO_DB[input.employmentType],
        openDate: new Date(input.openDate),
        applicantCount: 0,
      },
    });
    res.status(201).json(serializeJob(job));
  })
);

jobsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const input = jobUpdateSchema.parse(req.body);
    const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Job not found.");

    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        ...input,
        employmentType: input.employmentType ? EMPLOYMENT_TYPE_TO_DB[input.employmentType] : undefined,
        openDate: input.openDate ? new Date(input.openDate) : undefined,
      },
    });
    res.json(serializeJob(job));
  })
);
