import { Badge } from "@/components/ui/Badge";
import { getScoreTier, SCORE_TIER_BADGE_VARIANT, SCORE_TIER_LABEL } from "@/lib/scoreTier";
import { cn } from "@/lib/utils";

export function ScoreBadge({
  score,
  showLabel = false,
  className,
}: {
  score: number;
  showLabel?: boolean;
  className?: string;
}) {
  const tier = getScoreTier(score);
  return (
    <Badge variant={SCORE_TIER_BADGE_VARIANT[tier]} className={cn("font-mono tabular-nums", className)}>
      {score}
      {showLabel && <span className="font-sans font-normal">· {SCORE_TIER_LABEL[tier]}</span>}
    </Badge>
  );
}
