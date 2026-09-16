import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { scoreCandidateAgainstJob } from "../lib/scoring.js";
import { analyzeResume, JOB_OPTIONS } from "../lib/resumeAnalysis.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const aiRouter = Router();

const scoreSchema = z.object({
  skills: z.array(z.string()),
  yearsExperience: z.number(),
  education: z.string(),
  jobId: z.string(),
});

aiRouter.post(
  "/score",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = scoreSchema.parse(req.body);
    const job = await prisma.job.findUnique({ where: { id: input.jobId } });
    if (!job) throw new HttpError(404, "Job not found.");

    const result = scoreCandidateAgainstJob(
      { skills: input.skills, yearsExperience: input.yearsExperience, education: input.education },
      { skills: job.skills, seniority: job.seniority, scoringWeights: job.scoringWeights as { skills: number; experience: number; education: number } }
    );
    res.json(result);
  })
);

const analyzeSchema = z.object({
  fileName: z.string(),
  jobId: z.string().optional(),
});

aiRouter.post(
  "/resume/analyze",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = analyzeSchema.parse(req.body);
    res.json(analyzeResume(input));
  })
);

aiRouter.get(
  "/resume/job-options",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json(JOB_OPTIONS);
  })
);
