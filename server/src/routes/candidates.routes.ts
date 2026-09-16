import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { serializeCandidate } from "../lib/serialize.js";
import { createCandidateFromApplication } from "../lib/candidates.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const candidatesRouter = Router();

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

const candidateCreateSchema = z.object({
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
  stage: z.enum(["applied", "screened", "interview", "offer", "hired", "rejected"]),
  appliedAt: z.string(),
});

candidatesRouter.post(
  "/",
  requireAuth,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const input = candidateCreateSchema.parse(req.body);
    const candidate = await createCandidateFromApplication(input);
    res.status(201).json(serializeCandidate(candidate));
  })
);

candidatesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const candidates = await prisma.candidate.findMany({ orderBy: { appliedAt: "desc" } });
    res.json(candidates.map(serializeCandidate));
  })
);

candidatesRouter.get(
  "/search",
  requireAuth,
  asyncHandler(async (req, res) => {
    const query = String(req.query.q ?? "").trim().toLowerCase();
    const candidates = await prisma.candidate.findMany({ orderBy: { appliedAt: "desc" } });
    if (!query) {
      res.json(candidates.map(serializeCandidate));
      return;
    }
    const filtered = candidates.filter((c) => {
      const haystack = [c.name, c.education, ...c.skills, ...c.summaryBullets].join(" ").toLowerCase();
      return haystack.includes(query);
    });
    res.json(filtered.map(serializeCandidate));
  })
);

candidatesRouter.get(
  "/job/:jobId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const candidates = await prisma.candidate.findMany({
      where: { appliedJobId: req.params.jobId },
      orderBy: { appliedAt: "desc" },
    });
    res.json(candidates.map(serializeCandidate));
  })
);

candidatesRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id } });
    if (!candidate) throw new HttpError(404, "Candidate not found.");
    res.json(serializeCandidate(candidate));
  })
);

const stageSchema = z.object({
  stage: z.enum(["applied", "screened", "interview", "offer", "hired", "rejected"]),
});

candidatesRouter.patch(
  "/:id/stage",
  requireAuth,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const { stage } = stageSchema.parse(req.body);
    const existing = await prisma.candidate.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Candidate not found.");
    const candidate = await prisma.candidate.update({ where: { id: req.params.id }, data: { stage } });
    res.json(serializeCandidate(candidate));
  })
);
