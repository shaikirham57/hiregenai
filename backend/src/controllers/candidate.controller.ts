import { prisma } from "../config/database.js";
import { serializeCandidate } from "../utils/serializers.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { createCandidateFromApplication } from "../services/candidate.service.js";
import { screenResumeForJob, screeningToFitScore, toStoredScreening } from "../services/resumeScreening.service.js";
import { attachResumeSchema, candidateCreateSchema, stageSchema } from "../validators/candidate.schemas.js";

export const createCandidate = asyncHandler(async (req, res) => {
  const input = candidateCreateSchema.parse(req.body);
  const candidate = await createCandidateFromApplication(input);
  res.status(201).json(serializeCandidate(candidate));
});

export const listCandidates = asyncHandler(async (_req, res) => {
  const candidates = await prisma.candidate.findMany({ orderBy: { appliedAt: "desc" } });
  res.json(candidates.map(serializeCandidate));
});

export const searchCandidates = asyncHandler(async (req, res) => {
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
});

export const listCandidatesForJob = asyncHandler(async (req, res) => {
  const candidates = await prisma.candidate.findMany({
    where: { appliedJobId: req.params.jobId },
    orderBy: { appliedAt: "desc" },
  });
  res.json(candidates.map(serializeCandidate));
});

export const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id } });
  if (!candidate) throw new HttpError(404, "Candidate not found.");
  res.json(serializeCandidate(candidate));
});

export const updateCandidateStage = asyncHandler(async (req, res) => {
  const { stage } = stageSchema.parse(req.body);
  const existing = await prisma.candidate.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "Candidate not found.");
  const candidate = await prisma.candidate.update({ where: { id: req.params.id }, data: { stage } });
  res.json(serializeCandidate(candidate));
});

// Attaches a resume the recruiter uploaded (POST /api/resumes) to an existing
// candidate, e.g. one whose application predates resume storage. The resume is
// screened against the candidate's job, and the fit score is replaced with the
// result because the old one could not be traced to any resume content.
export const attachCandidateResume = asyncHandler(async (req, res) => {
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
  const screening = screenResumeForJob({ fileName: resume.fileName, text: resume.text }, job);

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
              screening: toStoredScreening(screening, job),
              skills: Array.from(new Set([...screening.extractedSkills, ...selfReported])),
              fitScore: screeningToFitScore(screening),
              summaryBullets: [screening.narrative],
            }
          : {}),
      },
    });
  });
  res.json(serializeCandidate(updated));
});
