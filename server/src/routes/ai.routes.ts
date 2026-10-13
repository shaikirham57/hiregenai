import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { scoreCandidateAgainstJob } from "../lib/scoring.js";
import { analyzeResume, JOB_OPTIONS } from "../lib/resumeAnalysis.js";
import { screenResumeText, jobRequirements } from "../lib/resumeScreening.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

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

const screenSchema = z.object({
  jobId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  // Text extracted from the resume in the browser (PDF/DOCX), capped well below the JSON body limit.
  text: z.string().max(60000),
});

// Screens real resume text against a recruiter-created job loaded from the database.
aiRouter.post(
  "/resume/screen",
  requireAuth,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const input = screenSchema.parse(req.body);
    const job = await prisma.job.findUnique({ where: { id: input.jobId } });
    if (!job) throw new HttpError(404, "This job no longer exists. Refresh the page and choose another job.");
    if (input.text.trim().length < 50) {
      throw new HttpError(422, "Couldn't read enough text from this resume. If it's a scanned image, upload a text-based PDF or DOCX.");
    }
    const screeningJob = {
      title: job.title,
      description: job.description,
      skills: job.skills,
      seniority: job.seniority,
      scoringWeights: job.scoringWeights as { skills: number; experience: number; education: number },
    };
    if (jobRequirements(screeningJob).length === 0) {
      throw new HttpError(422, `"${job.title}" has no required skills to screen against. Add skills or a skills list in its description in Job Management.`);
    }
    res.json(screenResumeText({ fileName: input.fileName, text: input.text }, screeningJob));
  })
);
