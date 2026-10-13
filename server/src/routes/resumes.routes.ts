import express, { Router } from "express";
import type { ResumeFile } from "@prisma/client";
import { prisma } from "../db.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  detectResumeKind,
  extractResumeText,
  MAX_RESUME_BYTES,
  RESUME_MIME_TYPES,
  ResumeFileError,
} from "../lib/resumeFile.js";
import { jobRequirements, screenResumeText, toScreeningJob } from "../lib/resumeScreening.js";

export const resumesRouter = Router();

type ResumeMeta = Pick<ResumeFile, "id" | "fileName" | "mimeType" | "sizeBytes" | "createdAt" | "uploadedById">;

const META_SELECT = { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true, uploadedById: true } as const;

function serializeResumeMeta(r: ResumeMeta) {
  return { id: r.id, fileName: r.fileName, mimeType: r.mimeType, sizeBytes: r.sizeBytes, uploadedAt: r.createdAt.toISOString() };
}

/** Recruiters can open any resume; a candidate can only open resumes they uploaded. */
function assertCanAccess(req: express.Request, resume: { uploadedById: string }) {
  if (req.auth!.role === "recruiter") return;
  if (resume.uploadedById !== req.auth!.sub) throw new HttpError(403, "You do not have access to this resume.");
}

// Upload: the raw file bytes are the request body; the original name is in X-File-Name.
resumesRouter.post(
  "/",
  requireAuth,
  express.raw({ type: () => true, limit: MAX_RESUME_BYTES }),
  asyncHandler(async (req, res) => {
    const data = req.body;
    if (!Buffer.isBuffer(data) || data.length === 0) throw new HttpError(400, "No file was uploaded.");
    const rawName = String(req.header("x-file-name") ?? "");
    let fileName: string;
    try {
      fileName = decodeURIComponent(rawName).replace(/[\\/\r\n"]/g, "_").slice(0, 200);
    } catch {
      throw new HttpError(400, "Invalid file name.");
    }
    if (!fileName) throw new HttpError(400, "Missing file name.");

    let kind;
    let text;
    try {
      kind = detectResumeKind(fileName, data);
      text = await extractResumeText(kind, data);
    } catch (err) {
      if (err instanceof ResumeFileError) throw new HttpError(422, err.message);
      throw err;
    }

    const resume = await prisma.resumeFile.create({
      data: { fileName, mimeType: RESUME_MIME_TYPES[kind], sizeBytes: data.length, data, text, uploadedById: req.auth!.sub },
      select: META_SELECT,
    });

    // When the upload is for a specific job, return what was read from the
    // resume and how it compares with that job's requirements.
    let analysis;
    const jobId = typeof req.query.jobId === "string" ? req.query.jobId : undefined;
    if (jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (job && jobRequirements(toScreeningJob(job)).length > 0) {
        analysis = screenResumeText({ fileName, text }, toScreeningJob(job));
      }
    }
    res.status(201).json({ ...serializeResumeMeta(resume), analysis });
  })
);

resumesRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resume = await prisma.resumeFile.findUnique({ where: { id: req.params.id }, select: META_SELECT });
    if (!resume) throw new HttpError(404, "Resume file not found.");
    assertCanAccess(req, resume);
    res.json(serializeResumeMeta(resume));
  })
);

// Streams the stored file. ?download=1 saves it; otherwise the browser opens it inline.
resumesRouter.get(
  "/:id/file",
  requireAuth,
  asyncHandler(async (req, res) => {
    const resume = await prisma.resumeFile.findUnique({
      where: { id: req.params.id },
      select: { ...META_SELECT, data: true },
    });
    if (!resume) throw new HttpError(404, "Resume file not found.");
    assertCanAccess(req, resume);

    const disposition = req.query.download === "1" ? "attachment" : "inline";
    const asciiName = resume.fileName.replace(/[^\x20-\x7e]/g, "_");
    res.setHeader("Content-Type", resume.mimeType);
    res.setHeader("Content-Length", String(resume.data.length));
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(resume.fileName)}`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.end(Buffer.from(resume.data));
  })
);
