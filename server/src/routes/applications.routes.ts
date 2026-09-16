import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { serializeApplication } from "../lib/serialize.js";
import { createCandidateFromApplication } from "../lib/candidates.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const applicationsRouter = Router();

applicationsRouter.get(
  "/candidate/:candidateId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const applications = await prisma.application.findMany({
      where: { candidateId: req.params.candidateId },
      orderBy: { appliedAt: "desc" },
    });
    res.json(applications.map(serializeApplication));
  })
);

applicationsRouter.get(
  "/has-applied",
  requireAuth,
  asyncHandler(async (req, res) => {
    const candidateId = String(req.query.candidateId ?? "");
    const jobId = String(req.query.jobId ?? "");
    const existing = await prisma.application.findFirst({ where: { candidateId, jobId } });
    res.json({ hasApplied: Boolean(existing) });
  })
);

applicationsRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) throw new HttpError(404, "Application not found.");
    res.json(serializeApplication(application));
  })
);

const fitScoreSchema = z.object({
  overall: z.number(),
  skills: z.number(),
  experience: z.number(),
  education: z.number(),
  confidence: z.enum(["high", "low"]),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  narrative: z.string(),
});

const applySchema = z.object({
  jobId: z.string(),
  personalInfo: z.record(z.string(), z.any()),
  background: z.record(z.string(), z.any()),
  screeningAnswers: z.array(z.any()),
  resumeFileName: z.string(),
  extractedSkills: z.array(z.string()),
  fitScore: fitScoreSchema,
});

applicationsRouter.post(
  "/",
  requireAuth,
  requireRole("candidate"),
  asyncHandler(async (req, res) => {
    const input = applySchema.parse(req.body);
    const candidateUserId = req.auth!.sub;

    const job = await prisma.job.findUnique({ where: { id: input.jobId } });
    if (!job) throw new HttpError(404, "Job not found.");

    const today = new Date().toISOString().slice(0, 10);

    const candidateProfile = await createCandidateFromApplication({
      name: `${input.personalInfo.firstName ?? ""} ${input.personalInfo.lastName ?? ""}`.trim() || "Applicant",
      email: input.personalInfo.email ?? "",
      location: input.personalInfo.location ?? job.location,
      appliedJobId: job.id,
      skills: input.extractedSkills,
      education: input.background.education ?? "",
      employmentHistory: input.background.employmentHistory ?? [],
      certifications: input.background.certifications ?? [],
      resumeFileName: input.resumeFileName,
      summaryBullets: [input.fitScore.narrative],
      fitScore: input.fitScore,
      authenticity: { status: "authentic", score: 92 },
      riskLevel: "low",
      riskFlags: [],
      languageTag: "en",
      stage: "applied",
      appliedAt: today,
    });

    const application = await prisma.application.create({
      data: {
        id: `app-${Date.now()}`,
        candidateId: candidateUserId,
        candidateProfileId: candidateProfile.id,
        jobId: job.id,
        jobTitle: job.title,
        company: "HireGen AI",
        location: job.location,
        stage: "applied",
        appliedAt: new Date(today),
        updatedAt: new Date(today),
        timeline: [{ stage: "applied", date: today, note: "Application submitted — AI resume screening completed automatically." }],
        personalInfo: input.personalInfo,
        background: input.background,
        screeningAnswers: input.screeningAnswers,
        resumeFileName: input.resumeFileName,
        matchScore: input.fitScore.overall,
      },
    });

    res.status(201).json(serializeApplication(application));
  })
);
