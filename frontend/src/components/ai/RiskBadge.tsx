import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { RiskLevel } from "@/types";

const CONFIG: Record<RiskLevel, { label: string; variant: "success" | "warning" | "error"; icon: typeof ShieldCheck }> = {
  low: { label: "Low risk", variant: "success", icon: ShieldCheck },
  medium: { label: "Medium risk", variant: "warning", icon: ShieldQuestion },
  high: { label: "High risk", variant: "error", icon: ShieldAlert },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const { label, variant, icon: Icon } = CONFIG[level];
  return (
    <Badge variant={variant} className={className}>
      <Icon className="size-3" />
      {label}
    </Badge>
  );
}
