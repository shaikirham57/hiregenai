export type ScoreTier = "strong" | "review" | "weak";

export function getScoreTier(score: number): ScoreTier {
  if (score >= 70) return "strong";
  if (score >= 40) return "review";
  return "weak";
}

export const SCORE_TIER_LABEL: Record<ScoreTier, string> = {
  strong: "Strong match",
  review: "Needs review",
  weak: "Weak match",
};

export const SCORE_TIER_BADGE_VARIANT: Record<ScoreTier, "success" | "warning" | "error"> = {
  strong: "success",
  review: "warning",
  weak: "error",
};
