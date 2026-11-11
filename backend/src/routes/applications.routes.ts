import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getApplication,
  hasApplied,
  listApplicationsForCandidate,
  submitApplication,
} from "../controllers/application.controller.js";

export const applicationsRouter = Router();

applicationsRouter.get("/candidate/:candidateId", requireAuth, listApplicationsForCandidate);
applicationsRouter.get("/has-applied", requireAuth, hasApplied);
applicationsRouter.get("/:id", requireAuth, getApplication);
applicationsRouter.post("/", requireAuth, requireRole("candidate"), submitApplication);
