import { Badge } from "@/components/ui/Badge";
import { PIPELINE_STAGE_LABELS, type PipelineStage } from "@/types";

const VARIANT: Record<PipelineStage, "neutral" | "primary" | "accent" | "warning" | "success" | "error"> = {
  applied: "neutral",
  screened: "primary",
  interview: "accent",
  offer: "warning",
  hired: "success",
  rejected: "error",
};

export function StatusPill({ stage, className }: { stage: PipelineStage; className?: string }) {
  return (
    <Badge variant={VARIANT[stage]} className={className}>
      {PIPELINE_STAGE_LABELS[stage]}
    </Badge>
  );
}
