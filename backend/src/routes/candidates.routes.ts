import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  attachCandidateResume,
  createCandidate,
  getCandidate,
  listCandidates,
  listCandidatesForJob,
  searchCandidates,
  updateCandidateStage,
} from "../controllers/candidate.controller.js";

export const candidatesRouter = Router();

candidatesRouter.post("/", requireAuth, requireRole("recruiter"), createCandidate);
candidatesRouter.get("/", requireAuth, listCandidates);
candidatesRouter.get("/search", requireAuth, searchCandidates);
candidatesRouter.get("/job/:jobId", requireAuth, listCandidatesForJob);
candidatesRouter.get("/:id", requireAuth, getCandidate);
candidatesRouter.patch("/:id/stage", requireAuth, requireRole("recruiter"), updateCandidateStage);
candidatesRouter.post("/:id/resume", requireAuth, requireRole("recruiter"), attachCandidateResume);
