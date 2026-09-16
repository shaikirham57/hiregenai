import { getScoreTier } from "@/lib/scoreTier";
import { cn } from "@/lib/utils";

const TIER_STROKE: Record<string, string> = {
  strong: "var(--sem-score-strong)",
  review: "var(--sem-score-review)",
  weak: "var(--sem-score-weak)",
};

export function ScoreGauge({
  score,
  size = 96,
  strokeWidth = 9,
  label,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const tier = getScoreTier(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const compact = size < 100;
  const innerDiameter = (radius - strokeWidth) * 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="fill-none stroke-sunken" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="fill-none transition-[stroke-dashoffset] duration-700 ease-[var(--ease-out-brand)]"
          stroke={TIER_STROKE[tier]}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center px-1 text-center" style={{ width: innerDiameter }}>
        <span className={cn("font-mono font-semibold tabular-nums text-heading", compact ? "text-base" : "text-xl")}>{score}</span>
        {label && (
          <span className={cn("font-medium uppercase text-muted leading-tight", compact ? "text-[8px] tracking-wide" : "text-[10px] tracking-eyebrow")}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
