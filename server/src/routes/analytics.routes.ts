import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const analyticsRouter = Router();

const FUNNEL_STAGES: { key: "applied" | "screened" | "interview" | "offer" | "hired"; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "screened", label: "Screened" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "hired", label: "Hired" },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

analyticsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const [candidates, jobs, interviews] = await Promise.all([
      prisma.candidate.findMany(),
      prisma.job.findMany(),
      prisma.interview.findMany(),
    ]);

    const openJobs = jobs.filter((j) => j.status === "open").length;
    const totalApplicants = candidates.length;
    const interviewsScheduled = interviews.filter((i) => i.status === "scheduled").length;

    const funnel = FUNNEL_STAGES.map(({ key, label }) => ({
      stage: label,
      count: candidates.filter((c) => c.stage === key).length,
    }));

    const skillCounts = new Map<string, number>();
    for (const c of candidates) {
      for (const skill of c.skills) skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
    }
    const topSkills = [...skillCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({ skill, count }));

    const fitScores = candidates
      .map((c) => (c.fitScore as { overall?: number } | null)?.overall)
      .filter((v): v is number => typeof v === "number");
    const avgFitScore = fitScores.length ? Math.round(fitScores.reduce((a, b) => a + b, 0) / fitScores.length) : 0;

    const authenticCount = candidates.filter((c) => c.authenticityStatus === "authentic").length;
    const resumeAuthenticityRate = candidates.length ? Math.round((authenticCount / candidates.length) * 100) : 0;

    const hiredCandidates = candidates.filter((c) => c.stage === "hired");
    const offerOrHiredCount = candidates.filter((c) => c.stage === "offer" || c.stage === "hired").length;
    const offerAcceptanceRate = offerOrHiredCount ? Math.round((hiredCandidates.length / offerOrHiredCount) * 100) : 0;

    const now = Date.now();
    const timeToHireDays = hiredCandidates.length
      ? Math.round(
          hiredCandidates.reduce((sum, c) => sum + (now - c.appliedAt.getTime()) / (1000 * 60 * 60 * 24), 0) /
            hiredCandidates.length
        )
      : 0;

    const hiresByMonthMap = new Map<string, number>();
    for (const c of hiredCandidates) {
      const label = MONTH_NAMES[c.appliedAt.getUTCMonth()];
      hiresByMonthMap.set(label, (hiresByMonthMap.get(label) ?? 0) + 1);
    }
    const hiresByMonth = [...hiresByMonthMap.entries()].map(([month, value]) => ({ month, value }));

    res.json({
      timeToHireDays,
      timeToHireTrend: 0,
      offerAcceptanceRate,
      avgFitScore,
      resumeAuthenticityRate,
      openJobs,
      totalApplicants,
      interviewsScheduled,
      funnel,
      topSkills,
      hiresByMonth,
    });
  })
);
