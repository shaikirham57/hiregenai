import { prisma } from "../config/database.js";
import { serializeApplication } from "../utils/serializers.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { createCandidateFromApplication } from "../services/candidate.service.js";
import { screenResumeForJob, screeningToFitScore, toStoredScreening } from "../services/resumeScreening.service.js";
import { applySchema } from "../validators/application.schemas.js";

export const listApplicationsForCandidate = asyncHandler(async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { appliedAt: "desc" },
  });
  res.json(applications.map(serializeApplication));
});

export const hasApplied = asyncHandler(async (req, res) => {
  const candidateId = String(req.query.candidateId ?? "");
  const jobId = String(req.query.jobId ?? "");
  const existing = await prisma.application.findFirst({ where: { candidateId, jobId } });
  res.json({ hasApplied: Boolean(existing) });
});

export const getApplication = asyncHandler(async (req, res) => {
  const application = await prisma.application.findUnique({ where: { id: req.params.id } });
  if (!application) throw new HttpError(404, "Application not found.");
  res.json(serializeApplication(application));
});

export const submitApplication = asyncHandler(async (req, res) => {
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
  const screening = screenResumeForJob({ fileName: resume.fileName, text: resume.text }, job);
  const selfReportedSkills: string[] = Array.isArray(input.background.skills) ? input.background.skills.map(String) : [];
  const fitScore = screening
    ? screeningToFitScore(screening)
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
    screening: screening ? toStoredScreening(screening, job) : null,
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
});
