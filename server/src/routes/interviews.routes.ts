import { Router } from "express";
import { prisma } from "../db.js";
import { serializeInterview } from "../lib/serialize.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const interviewsRouter = Router();

interviewsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const interviews = await prisma.interview.findMany({ orderBy: { scheduledAt: "desc" } });
    res.json(interviews.map(serializeInterview));
  })
);

interviewsRouter.get(
  "/candidate/:candidateId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const interviews = await prisma.interview.findMany({
      where: { candidateId: req.params.candidateId },
      orderBy: { scheduledAt: "desc" },
    });
    res.json(interviews.map(serializeInterview));
  })
);

interviewsRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const interview = await prisma.interview.findUnique({ where: { id: req.params.id } });
    if (!interview) throw new HttpError(404, "Interview not found.");
    res.json(serializeInterview(interview));
  })
);
