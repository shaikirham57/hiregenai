import { prisma } from "../config/database.js";
import { serializeJob } from "../utils/serializers.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { jobCreateSchema, jobUpdateSchema } from "../validators/job.schemas.js";

const EMPLOYMENT_TYPE_TO_DB: Record<string, "Full_time" | "Part_time" | "Contract"> = {
  "Full-time": "Full_time",
  "Part-time": "Part_time",
  Contract: "Contract",
};

export const listJobs = asyncHandler(async (_req, res) => {
  const jobs = await prisma.job.findMany({ orderBy: { openDate: "desc" } });
  res.json(jobs.map(serializeJob));
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) throw new HttpError(404, "Job not found.");
  res.json(serializeJob(job));
});

export const createJob = asyncHandler(async (req, res) => {
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
});

export const updateJob = asyncHandler(async (req, res) => {
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
});
