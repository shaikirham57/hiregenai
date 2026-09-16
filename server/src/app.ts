import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { jobsRouter } from "./routes/jobs.routes.js";
import { candidatesRouter } from "./routes/candidates.routes.js";
import { applicationsRouter } from "./routes/applications.routes.js";
import { assessmentsRouter } from "./routes/assessments.routes.js";
import { interviewsRouter } from "./routes/interviews.routes.js";
import { notificationsRouter } from "./routes/notifications.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { aiRouter } from "./routes/ai.routes.js";

export const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/candidates", candidatesRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/assessments", assessmentsRouter);
app.use("/api/interviews", interviewsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ai", aiRouter);

app.use(errorHandler);
