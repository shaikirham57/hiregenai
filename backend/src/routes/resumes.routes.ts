import express, { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { MAX_RESUME_BYTES } from "../services/resumeFile.service.js";
import { downloadResumeFile, getResume, uploadResume } from "../controllers/resume.controller.js";

export const resumesRouter = Router();

// Upload takes the raw file bytes as the request body.
resumesRouter.post("/", requireAuth, express.raw({ type: () => true, limit: MAX_RESUME_BYTES }), uploadResume);
resumesRouter.get("/:id", requireAuth, getResume);
resumesRouter.get("/:id/file", requireAuth, downloadResumeFile);
