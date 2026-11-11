import { prisma } from "../config/database.js";
import { serializeInterview } from "../utils/serializers.js";
import { asyncHandler, HttpError } from "../utils/http.js";

export const listInterviews = asyncHandler(async (_req, res) => {
  const interviews = await prisma.interview.findMany({ orderBy: { scheduledAt: "desc" } });
  res.json(interviews.map(serializeInterview));
});

export const listInterviewsForCandidate = asyncHandler(async (req, res) => {
  const interviews = await prisma.interview.findMany({
    where: { candidateId: req.params.candidateId },
    orderBy: { scheduledAt: "desc" },
  });
  res.json(interviews.map(serializeInterview));
});

export const getInterview = asyncHandler(async (req, res) => {
  const interview = await prisma.interview.findUnique({ where: { id: req.params.id } });
  if (!interview) throw new HttpError(404, "Interview not found.");
  res.json(serializeInterview(interview));
});
