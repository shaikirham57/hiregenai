import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { serializeApplication } from "../lib/serialize.js";
import { createCandidateFromApplication } from "../lib/candidates.js";
import { jobRequirements, screenResumeText, toScreeningJob } from "../lib/resumeScreening.js";
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
  // The stored resume (POST /api/resumes) this application is submitted with.
  resumeFileId: z.string().min(1),
  // Legacy fields from older clients. The server now derives these from the stored resume.
  resumeFileName: z.string().optional(),
  extractedSkills: z.array(z.string()).optional(),
  fitScore: fitScoreSchema.optional(),
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

    const resume = await prisma.resumeFile.findUnique({
      where: { id: input.resumeFileId },
      select: { id: true, fileName: true, text: true, uploadedById: true },
    });
    if (!resume) throw new HttpError(400, "The uploaded resume could not be found. Please upload it again.");
    if (resume.uploadedById !== candidateUserId) throw new HttpError(403, "You can only apply with a resume you uploaded.");

    // Screen the stored resume text against this job's actual requirements.
    const screeningJob = toScreeningJob(job);
    const screening =
      jobRequirements(screeningJob).length > 0 ? screenResumeText({ fileName: resume.fileName, text: resume.text }, screeningJob) : null;
    const selfReportedSkills: string[] = Array.isArray(input.background.skills) ? input.background.skills.map(String) : [];
    const fitScore = screening
      ? {
          overall: screening.matchScore,
          skills: screening.scoreBreakdown.skills,
          experience: screening.scoreBreakdown.experience,
          education: screening.scoreBreakdown.education,
          confidence: screening.matchedSkills.length >= 3 ? ("high" as const) : ("low" as const),
          matchedSkills: screening.matchedSkills,
          missingSkills: screening.missingSkills,
          narrative: screening.narrative,
        }
      : (input.fitScore ?? {
          overall: 0,
          skills: 0,
          experience: 0,
          education: 0,
          confidence: "low" as const,
          matchedSkills: [],
          missingSkills: [],
          narrative: "Not screened: this job has no required skills listed.",
        });
    const fullName =
      String(input.personalInfo.fullName ?? "").trim() ||
      `${input.personalInfo.firstName ?? ""} ${input.personalInfo.lastName ?? ""}`.trim() ||
      "Applicant";

    const today = new Date().toISOString().slice(0, 10);

    const candidateProfile = await createCandidateFromApplication({
      name: fullName,
      email: input.personalInfo.email ?? "",
      location: input.personalInfo.location ?? job.location,
      appliedJobId: job.id,
      skills: Array.from(new Set([...(screening?.extractedSkills ?? []), ...selfReportedSkills])),
      education: input.background.education ?? "",
      employmentHistory: input.background.employmentHistory ?? [],
      certifications: input.background.certifications ?? [],
      resumeFileName: resume.fileName,
      resumeFileId: resume.id,
      screening: screening
        ? { ...screening, jobId: job.id, jobTitle: job.title, screenedAt: new Date().toISOString(), source: "resume" }
        : null,
      summaryBullets: [fitScore.narrative],
      fitScore,
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
        timeline: [
          {
            stage: "applied",
            date: today,
            note: screening ? "Application submitted. Resume screened against the job's requirements." : "Application submitted.",
          },
        ],
        personalInfo: input.personalInfo,
        background: input.background,
        screeningAnswers: input.screeningAnswers,
        resumeFileName: resume.fileName,
        resumeFileId: resume.id,
        matchScore: fitScore.overall,
      },
    });

    res.status(201).json(serializeApplication(application));
  })
);
