import { Check, X as XIcon } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { ScoreGauge } from "@/components/ai/ScoreGauge";
import { FitScoreBar } from "@/components/ai/FitScoreBar";
import { AiGeneratedTag } from "@/components/ai/AiGeneratedTag";
import type { Candidate } from "@/types";

export function XaiDrawer({
  candidate,
  open,
  onOpenChange,
}: {
  candidate: Candidate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { fitScore } = candidate;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent title="Why this score?" description={`AI Fit Score explanation for ${candidate.name}`}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-5 rounded-lg bg-sunken p-4">
            <ScoreGauge score={fitScore.overall} label="Fit score" />
            <div className="flex-1 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Score breakdown</p>
              <FitScoreBar label="Skills" value={fitScore.skills} />
              <FitScoreBar label="Experience" value={fitScore.experience} />
              <FitScoreBar label="Education" value={fitScore.education} />
            </div>
          </div>

          {fitScore.confidence === "low" && (
            <Badge variant="warning" className="w-fit">
              Low data confidence — limited extractable resume detail
            </Badge>
          )}

          <div>
            <p className="mb-2 text-[13px] font-semibold text-heading">AI reasoning</p>
            <div className="flex items-start gap-2 rounded-md border border-line bg-canvas p-3">
              <AiGeneratedTag className="shrink-0" label="AI generated" />
              <p className="text-[13px] leading-relaxed text-ink">{fitScore.narrative}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-heading">Key strengths</p>
            <div className="flex flex-wrap gap-1.5">
              {fitScore.matchedSkills.length === 0 && <span className="text-[13px] text-muted">No direct skill matches found.</span>}
              {fitScore.matchedSkills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-pill bg-score-strong-bg px-2.5 py-1 text-[12px] font-medium text-score-strong">
                  <Check className="size-3" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-heading">Potential gaps</p>
            {fitScore.missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {fitScore.missingSkills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 rounded-pill bg-score-weak-bg px-2.5 py-1 text-[12px] font-medium text-score-weak">
                    <XIcon className="size-3" />
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted">No significant gaps detected.</p>
            )}
          </div>

          <div className="rounded-md border border-line-strong p-3 text-[12px] text-muted">
            Authenticity score {candidate.authenticity.score} · Risk level{" "}
            <span className="font-medium text-ink">{candidate.riskLevel}</span>. Every score is explainable end-to-end —
            overrides are logged for audit.
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
