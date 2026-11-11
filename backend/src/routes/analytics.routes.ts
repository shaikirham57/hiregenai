import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAnalytics } from "../controllers/analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.get("/", requireAuth, getAnalytics);
