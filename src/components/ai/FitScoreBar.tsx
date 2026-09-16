import { getScoreTier } from "@/lib/scoreTier";
import { cn } from "@/lib/utils";

const TIER_COLOR: Record<string, string> = {
  strong: "bg-score-strong",
  review: "bg-score-review",
  weak: "bg-score-weak",
};

export function FitScoreBar({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  const tier = getScoreTier(value);
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="w-[92px] shrink-0 truncate text-[12px] text-muted" title={label}>
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-sunken">
        <div
          className={cn("h-full rounded-pill transition-[width] duration-500 ease-[var(--ease-out-brand)]", TIER_COLOR[tier])}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right font-mono text-[12px] tabular-nums text-ink">{value}</span>
    </div>
  );
}
