import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export function KpiTile({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel = "vs last month",
  invertTrendColor = false,
  tooltip,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  invertTrendColor?: boolean;
  tooltip?: ReactNode;
}) {
  const isPositive = (trend ?? 0) >= 0;
  const isGood = invertTrendColor ? !isPositive : isPositive;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="flex items-center gap-1 text-[13px] font-medium text-muted">
          {label}
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="size-3 cursor-help" />
            </Tooltip>
          )}
        </span>
        <div className="flex size-8 items-center justify-center rounded-md bg-brand-blue-100 text-primary dark:bg-primary/15">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-h1 font-bold text-heading">{value}</p>
      {trend !== undefined && (
        <div className={cn("mt-2 flex items-center gap-1 text-[12px] font-medium", isGood ? "text-score-strong" : "text-score-weak")}>
          {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          <span>{Math.abs(trend)}%</span>
          <span className="font-normal text-muted">{trendLabel}</span>
        </div>
      )}
    </Card>
  );
}
