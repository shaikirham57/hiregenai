import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getInterview, listInterviews, listInterviewsForCandidate } from "../controllers/interview.controller.js";

export const interviewsRouter = Router();

interviewsRouter.get("/", requireAuth, listInterviews);
interviewsRouter.get("/candidate/:candidateId", requireAuth, listInterviewsForCandidate);
interviewsRouter.get("/:id", requireAuth, getInterview);
