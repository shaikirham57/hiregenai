import { useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { ScoreBadge } from "@/components/ai/ScoreBadge";
import { RiskBadge } from "@/components/ai/RiskBadge";
import * as candidatesService from "@/services/candidatesService";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type Candidate, type PipelineStage } from "@/types";

const ALL_STAGES: PipelineStage[] = [...PIPELINE_STAGES, "rejected"];

interface PendingMove {
  candidate: Candidate;
  toStage: PipelineStage;
}

export function PipelineBoard({
  candidates,
  onCandidateUpdate,
  jobTitleFor,
}: {
  candidates: Candidate[];
  onCandidateUpdate: (candidate: Candidate) => void;
  jobTitleFor: (jobId: string) => string;
}) {
  const { toast } = useToast();
  const [dragCandidateId, setDragCandidateId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const columns = PIPELINE_STAGES.map((stage) => ({
    stage,
    items: candidates.filter((c) => c.stage === stage),
  }));

  const commitMove = async (candidate: Candidate, toStage: PipelineStage) => {
    try {
      const updated = await candidatesService.updateCandidateStage(candidate.id, toStage);
      if (!updated) return;
      onCandidateUpdate(updated);
      toast({ title: "Stage updated", description: `${candidate.name} moved to ${PIPELINE_STAGE_LABELS[toStage]}.`, variant: "success" });
    } catch (error) {
      toast({
        title: "Couldn't update stage",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  const requestStageChange = (candidate: Candidate, toStage: PipelineStage) => {
    if (candidate.stage === toStage) return;

    const fromIndex = PIPELINE_STAGES.indexOf(candidate.stage as PipelineStage);
    const toIndex = PIPELINE_STAGES.indexOf(toStage);
    const isBackward = fromIndex !== -1 && toIndex < fromIndex;

    if (isBackward) {
      setPendingMove({ candidate, toStage });
    } else {
      commitMove(candidate, toStage);
    }
  };

  const handleDrop = (toStage: PipelineStage) => {
    setDragOverStage(null);
    if (!dragCandidateId) return;
    const candidate = candidates.find((c) => c.id === dragCandidateId);
    setDragCandidateId(null);
    if (!candidate) return;
    requestStageChange(candidate, toStage);
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map(({ stage, items }) => (
          <div
            key={stage}
            onDragOver={(e: DragEvent) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage((prev) => (prev === stage ? null : prev))}
            onDrop={() => handleDrop(stage)}
            className={cn(
              "flex min-w-[220px] flex-1 flex-col rounded-lg border border-line bg-sunken/50 p-2 transition-colors",
              dragOverStage === stage && "border-accent bg-accent/5"
            )}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[12.5px] font-semibold text-heading">{PIPELINE_STAGE_LABELS[stage]}</span>
              <span className="rounded-pill bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">{items.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5 min-h-[80px]">
              {items.map((candidate) => (
                <div
                  key={candidate.id}
                  draggable
                  onDragStart={() => setDragCandidateId(candidate.id)}
                  onDragEnd={() => setDragCandidateId(null)}
                  className={cn(
                    "cursor-grab rounded-md border border-line bg-surface p-2.5 shadow-xs transition-opacity active:cursor-grabbing",
                    dragCandidateId === candidate.id && "opacity-40"
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    <Link to={`/candidates/${candidate.id}`} className="flex min-w-0 flex-1 items-start gap-2">
                      <Avatar name={candidate.name} color={candidate.avatarColor} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-heading">{candidate.name}</p>
                        <p className="truncate text-[11.5px] text-muted">{jobTitleFor(candidate.appliedJobId)}</p>
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="shrink-0 rounded-sm p-0.5 text-muted transition-colors hover:bg-sunken hover:text-ink"
                          aria-label={`Change stage for ${candidate.name}`}
                        >
                          <MoreVertical className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
                        {ALL_STAGES.filter((s) => s !== candidate.stage).map((s) => (
                          <DropdownMenuItem key={s} onSelect={() => requestStageChange(candidate, s)}>
                            {PIPELINE_STAGE_LABELS[s]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <ScoreBadge score={candidate.fitScore.overall} />
                    <RiskBadge level={candidate.riskLevel} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!pendingMove} onOpenChange={(open) => !open && setPendingMove(null)}>
        {pendingMove && (
          <ModalContent
            title={pendingMove.toStage === "rejected" ? "Reject this candidate?" : "Move candidate backward?"}
            description={
              pendingMove.toStage === "rejected"
                ? `${pendingMove.candidate.name} will be marked as rejected for this role.`
                : `${pendingMove.candidate.name} is currently in ${PIPELINE_STAGE_LABELS[pendingMove.candidate.stage]}. This will move them back to ${PIPELINE_STAGE_LABELS[pendingMove.toStage]}.`
            }
          >
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingMove(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  commitMove(pendingMove.candidate, pendingMove.toStage);
                  setPendingMove(null);
                }}
              >
                {pendingMove.toStage === "rejected" ? "Reject candidate" : "Move back"}
              </Button>
            </div>
          </ModalContent>
        )}
      </Modal>
    </>
  );
}
