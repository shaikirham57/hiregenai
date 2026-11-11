import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getAssessment,
  listAssessmentResults,
  listAssessments,
  listAssessmentsForJob,
} from "../controllers/assessment.controller.js";

export const assessmentsRouter = Router();

assessmentsRouter.get("/", requireAuth, listAssessments);
assessmentsRouter.get("/job/:jobId", requireAuth, listAssessmentsForJob);
assessmentsRouter.get("/:id/results", requireAuth, listAssessmentResults);
assessmentsRouter.get("/:id", requireAuth, getAssessment);
