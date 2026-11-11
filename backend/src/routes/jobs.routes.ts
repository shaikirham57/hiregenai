import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createJob, getJob, listJobs, updateJob } from "../controllers/job.controller.js";

export const jobsRouter = Router();

jobsRouter.get("/", listJobs);
jobsRouter.get("/:id", getJob);
jobsRouter.post("/", requireAuth, requireRole("recruiter"), createJob);
jobsRouter.patch("/:id", requireAuth, requireRole("recruiter"), updateJob);
