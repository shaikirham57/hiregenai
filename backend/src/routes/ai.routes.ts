import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  analyzeResumeFile,
  generateJobDescription,
  getResumeJobOptions,
  scoreCandidate,
  screenResume,
} from "../controllers/ai.controller.js";

export const aiRouter = Router();

aiRouter.post("/score", requireAuth, scoreCandidate);
aiRouter.post("/resume/analyze", requireAuth, analyzeResumeFile);
aiRouter.get("/resume/job-options", requireAuth, getResumeJobOptions);
aiRouter.post("/resume/screen", requireAuth, requireRole("recruiter"), screenResume);
aiRouter.post("/job-description", requireAuth, requireRole("recruiter"), generateJobDescription);
