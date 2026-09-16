import { Router } from "express";
import { prisma } from "../db.js";
import { serializeAssessment, serializeAssessmentResult } from "../lib/serialize.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const assessmentsRouter = Router();

assessmentsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const assessments = await prisma.assessment.findMany();
    res.json(assessments.map(serializeAssessment));
  })
);

assessmentsRouter.get(
  "/job/:jobId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const assessments = await prisma.assessment.findMany({ where: { jobId: req.params.jobId } });
    res.json(assessments.map(serializeAssessment));
  })
);

assessmentsRouter.get(
  "/:id/results",
  requireAuth,
  asyncHandler(async (req, res) => {
    const results = await prisma.assessmentResult.findMany({ where: { assessmentId: req.params.id } });
    res.json(results.map(serializeAssessmentResult));
  })
);

assessmentsRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) throw new HttpError(404, "Assessment not found.");
    res.json(serializeAssessment(assessment));
  })
);
