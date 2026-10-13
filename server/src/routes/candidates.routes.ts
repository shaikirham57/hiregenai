import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { serializeCandidate } from "../lib/serialize.js";
import { createCandidateFromApplication } from "../lib/candidates.js";
import { jobRequirements, screenResumeText, toScreeningJob } from "../lib/resumeScreening.js";
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

const attachResumeSchema = z.object({ resumeFileId: z.string().min(1) });

// Attaches a resume the recruiter uploaded (POST /api/resumes) to an existing
// candidate, e.g. one whose application predates resume storage. The resume is
// screened against the candidate's job, and the fit score is replaced with the
// result because the old one could not be traced to any resume content.
candidatesRouter.post(
  "/:id/resume",
  requireAuth,
  requireRole("recruiter"),
  asyncHandler(async (req, res) => {
    const { resumeFileId } = attachResumeSchema.parse(req.body);
    const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id } });
    if (!candidate) throw new HttpError(404, "Candidate not found.");
    const resume = await prisma.resumeFile.findUnique({
      where: { id: resumeFileId },
      select: { id: true, fileName: true, text: true, uploadedById: true },
    });
    if (!resume) throw new HttpError(400, "The uploaded resume could not be found. Please upload it again.");
    if (resume.uploadedById !== req.auth!.sub) throw new HttpError(403, "You can only attach a resume you uploaded.");

    const job = await prisma.job.findUnique({ where: { id: candidate.appliedJobId } });
    if (!job) throw new HttpError(404, "This candidate's job no longer exists.");
    const screeningJob = toScreeningJob(job);
    const screening =
      jobRequirements(screeningJob).length > 0 ? screenResumeText({ fileName: resume.fileName, text: resume.text }, screeningJob) : null;

    // Self-reported skills from the candidate's application are kept alongside what the resume shows.
    const applications = await prisma.application.findMany({ where: { candidateProfileId: candidate.id } });
    const selfReported = applications.flatMap((a) => {
      const skills = (a.background as { skills?: unknown } | null)?.skills;
      return Array.isArray(skills) ? skills.map(String) : [];
    });

    const updated = await prisma.$transaction(async (tx) => {
      if (applications.length > 0) {
        await tx.application.updateMany({
          where: { candidateProfileId: candidate.id },
          data: { resumeFileId: resume.id, resumeFileName: resume.fileName, ...(screening ? { matchScore: screening.matchScore } : {}) },
        });
      }
      return tx.candidate.update({
        where: { id: candidate.id },
        data: {
          resumeFileId: resume.id,
          resumeFileName: resume.fileName,
          ...(screening
            ? {
                screening: { ...screening, jobId: job.id, jobTitle: job.title, screenedAt: new Date().toISOString(), source: "resume" },
                skills: Array.from(new Set([...screening.extractedSkills, ...selfReported])),
                fitScore: {
                  overall: screening.matchScore,
                  skills: screening.scoreBreakdown.skills,
                  experience: screening.scoreBreakdown.experience,
                  education: screening.scoreBreakdown.education,
                  confidence: screening.matchedSkills.length >= 3 ? "high" : "low",
                  matchedSkills: screening.matchedSkills,
                  missingSkills: screening.missingSkills,
                  narrative: screening.narrative,
                },
                summaryBullets: [screening.narrative],
              }
            : {}),
        },
      });
    });
    res.json(serializeCandidate(updated));
  })
);
