/**
 * Tracks a candidate's own progress through an assessment for the current browser session only.
 *
 * There is no backend persistence anywhere in the app for a candidate's own assessment progress
 * or score — submitting an assessment never writes to any service. This is a real, honest record
 * of what the candidate actually did in this session (not a fabricated score or backend status),
 * scoped to sessionStorage so it survives navigation between pages but not a new browser session.
 */

export type AssessmentProgressStatus = "not_started" | "in_progress" | "completed";

export interface AssessmentProgress {
  status: AssessmentProgressStatus;
  answers?: Record<string, string>;
  currentIndex?: number;
  completedAt?: string;
}

const KEY_PREFIX = "hiregen:assessment-progress:";

export function getAssessmentProgress(assessmentId: string): AssessmentProgress {
  if (typeof window === "undefined") return { status: "not_started" };
  try {
    const raw = window.sessionStorage.getItem(KEY_PREFIX + assessmentId);
    if (!raw) return { status: "not_started" };
    return JSON.parse(raw) as AssessmentProgress;
  } catch {
    return { status: "not_started" };
  }
}

export function saveAssessmentProgress(assessmentId: string, progress: AssessmentProgress) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY_PREFIX + assessmentId, JSON.stringify(progress));
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing) — progress just won't persist.
  }
}
