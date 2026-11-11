import { prisma } from "../config/database.js";
import { serializeAssessment, serializeAssessmentResult } from "../utils/serializers.js";
import { asyncHandler, HttpError } from "../utils/http.js";

export const listAssessments = asyncHandler(async (_req, res) => {
  const assessments = await prisma.assessment.findMany();
  res.json(assessments.map(serializeAssessment));
});

export const listAssessmentsForJob = asyncHandler(async (req, res) => {
  const assessments = await prisma.assessment.findMany({ where: { jobId: req.params.jobId } });
  res.json(assessments.map(serializeAssessment));
});

export const listAssessmentResults = asyncHandler(async (req, res) => {
  const results = await prisma.assessmentResult.findMany({ where: { assessmentId: req.params.id } });
  res.json(results.map(serializeAssessmentResult));
});

export const getAssessment = asyncHandler(async (req, res) => {
  const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
  if (!assessment) throw new HttpError(404, "Assessment not found.");
  res.json(serializeAssessment(assessment));
});
