import { prisma } from "../config/database.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { scoreCandidateAgainstJob } from "../services/scoring.service.js";
import { analyzeResume, JOB_OPTIONS } from "../services/resumeAnalysis.service.js";
import { jobRequirements, screenResumeText, toScreeningJob } from "../services/resumeScreening.service.js";
import { chatCompletion } from "../services/ai.service.js";
import { analyzeSchema, jobDescriptionSchema, scoreSchema, screenSchema } from "../validators/ai.schemas.js";

export const scoreCandidate = asyncHandler(async (req, res) => {
  const input = scoreSchema.parse(req.body);
  const job = await prisma.job.findUnique({ where: { id: input.jobId } });
  if (!job) throw new HttpError(404, "Job not found.");

  const result = scoreCandidateAgainstJob(
    { skills: input.skills, yearsExperience: input.yearsExperience, education: input.education },
    { skills: job.skills, seniority: job.seniority, scoringWeights: job.scoringWeights as { skills: number; experience: number; education: number } }
  );
  res.json(result);
});

export const analyzeResumeFile = asyncHandler(async (req, res) => {
  const input = analyzeSchema.parse(req.body);
  res.json(analyzeResume(input));
});

export const getResumeJobOptions = asyncHandler(async (_req, res) => {
  res.json(JOB_OPTIONS);
});

// Screens real resume text against a recruiter-created job loaded from the database.
export const screenResume = asyncHandler(async (req, res) => {
  const input = screenSchema.parse(req.body);
  const job = await prisma.job.findUnique({ where: { id: input.jobId } });
  if (!job) throw new HttpError(404, "This job no longer exists. Refresh the page and choose another job.");
  if (input.text.trim().length < 50) {
    throw new HttpError(422, "Couldn't read enough text from this resume. If it's a scanned image, upload a text-based PDF or DOCX.");
  }
  const screeningJob = toScreeningJob(job);
  if (jobRequirements(screeningJob).length === 0) {
    throw new HttpError(422, `"${job.title}" has no required skills to screen against. Add skills or a skills list in its description in Job Management.`);
  }
  res.json(screenResumeText({ fileName: input.fileName, text: input.text }, screeningJob));
});

const TONE_GUIDE = {
  professional: "professional and polished",
  casual: "friendly and conversational",
  concise: "short and to the point (under 150 words)",
} as const;

// Writes a job description draft with the configured AI model.
export const generateJobDescription = asyncHandler(async (req, res) => {
  const input = jobDescriptionSchema.parse(req.body);
  const skills = input.skills.length > 0 ? input.skills.join(", ") : "the core skills for this role";

  const text = await chatCompletion([
    {
      role: "system",
      content:
        "You write job descriptions for a recruiting platform. Output plain text only: no markdown, no bold, no headings with #. " +
        'Use "- " for bullet points. Use inclusive, gender-neutral language and avoid jargon like "rockstar" or "ninja". ' +
        "Do not invent a company name, salary, or benefits that were not given.",
    },
    {
      role: "user",
      content:
        `Write a job description for a ${input.seniority} ${input.title} based in ${input.location}.\n` +
        `Key skills: ${skills}.\n` +
        `Tone: ${TONE_GUIDE[input.tone]}.\n` +
        'Structure: a short opening paragraph, then "What you\'ll do:" with 4-6 bullets, then "What we\'re looking for:" with 4-6 bullets, then a one-line closing.',
    },
  ]);

  // Remove any markdown the model adds anyway, so the text fits the plain textarea.
  const description = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[*•]\s+/gm, "- ")
    .trim();
  res.json({ description });
});
