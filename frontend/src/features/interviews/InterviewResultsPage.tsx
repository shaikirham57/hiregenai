import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Check, Quote, Sparkles, ThumbsDown, ThumbsUp, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FitScoreBar } from "@/components/ai/FitScoreBar";
import { ScoreGauge } from "@/components/ai/ScoreGauge";
import * as interviewsService from "@/services/interviewsService";
import * as candidatesService from "@/services/candidatesService";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGE_LABELS, type Candidate, type Interview, type InterviewRecommendation } from "@/types";

const RECOMMENDATION_CONFIG: Record<InterviewRecommendation, { label: string; variant: "success" | "warning" | "error"; icon: typeof ThumbsUp }> = {
  recommend: { label: "Recommend", variant: "success", icon: ThumbsUp },
  hold: { label: "Hold", variant: "warning", icon: Quote },
  reject: { label: "Reject", variant: "error", icon: ThumbsDown },
};

export default function InterviewResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [interview, setInterview] = useState<Interview | undefined>();
  const [candidate, setCandidate] = useState<Candidate | undefined>();
  const [loading, setLoading] = useState(true);
  const [decisionLoading, setDecisionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    interviewsService.getInterviewById(id).then((data) => {
      setInterview(data);
      setLoading(false);
      if (data) candidatesService.getCandidateById(data.candidateId).then(setCandidate);
    });
  }, [id]);

  const advanceOrReject = async (stage: "offer" | "rejected") => {
    if (!candidate) return;
    setDecisionLoading(true);
    const updated = await candidatesService.updateCandidateStage(candidate.id, stage);
    if (updated) {
      setCandidate(updated);
      toast({ title: "Candidate updated", description: `${updated.name} moved to ${PIPELINE_STAGE_LABELS[stage]}.`, variant: "success" });
    }
    setDecisionLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!interview || interview.status !== "completed") {
    return (
      <EmptyState
        title="Results not available"
        description="This interview may not have taken place yet."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/interviews">Back to interviews</Link>
          </Button>
        }
      />
    );
  }

  const recommendation = interview.recommendation ? RECOMMENDATION_CONFIG[interview.recommendation] : null;

  return (
    <div>
      <Link to="/interviews" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Back to interviews
      </Link>

      <PageHeader
        title={`Interview results — ${interview.candidateName}`}
        description={`${interview.jobTitle} · ${format(new Date(interview.scheduledAt), "MMM d, yyyy")} with ${interview.interviewer}`}
      />

      {interview.overallScore !== undefined && recommendation && (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-start gap-3.5 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand-soft text-primary">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">AI Interview Summary</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink">
                {interview.candidateName} scored <span className="font-semibold text-heading">{interview.overallScore}/100</span> overall and the
                AI recommendation is <span className="font-semibold text-heading">{recommendation.label}</span>.
                {interview.strengths?.[0] && <> Key strength: {interview.strengths[0]}.</>}
                {interview.weaknesses?.[0] && <> Area to review: {interview.weaknesses[0]}.</>}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {recommendation && (
            <Card
              className={cn(
                "border-2",
                recommendation.variant === "success" ? "border-score-strong" : recommendation.variant === "warning" ? "border-score-review" : "border-score-weak"
              )}
            >
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">AI Recommendation</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full",
                      recommendation.variant === "success"
                        ? "bg-score-strong-bg text-score-strong"
                        : recommendation.variant === "warning"
                          ? "bg-score-review-bg text-score-review"
                          : "bg-score-weak-bg text-score-weak"
                    )}
                  >
                    <recommendation.icon className="size-5" />
                  </div>
                  <Badge variant={recommendation.variant} className="px-3 py-1.5 text-[14px]">
                    {recommendation.label}
                  </Badge>
                </div>
                <p className="mt-3.5 text-[13px] leading-relaxed text-ink">{interview.justification}</p>

                {candidate?.stage === "interview" && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                    <Button size="sm" loading={decisionLoading} onClick={() => advanceOrReject("offer")}>
                      <ThumbsUp className="size-3.5" /> Advance
                    </Button>
                    <Button size="sm" variant="outline" loading={decisionLoading} onClick={() => advanceOrReject("rejected")}>
                      <ThumbsDown className="size-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {interview.transcriptExcerpt && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Quote className="size-4 text-muted" />
                  <CardTitle>Transcript excerpt</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="rounded-md border-l-4 border-l-primary/40 bg-sunken/50 p-4 text-[13.5px] leading-[1.75] text-ink">
                  {interview.transcriptExcerpt}
                </p>
                <p className="mt-1.5 text-[11.5px] text-muted">Verbatim excerpt from the interview session.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Strengths &amp; weaknesses</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 pt-2 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-eyebrow text-score-strong">
                  <Check className="size-3.5" /> Strengths
                </p>
                <ul className="space-y-1.5">
                  {interview.strengths?.map((s, i) => (
                    <li key={i} className="text-[13px] leading-relaxed text-ink">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-eyebrow text-score-review">
                  <TriangleAlert className="size-3.5" /> Areas to review
                </p>
                {interview.weaknesses && interview.weaknesses.length > 0 ? (
                  <ul className="space-y-1.5">
                    {interview.weaknesses.map((s, i) => (
                      <li key={i} className="text-[13px] leading-relaxed text-ink">
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-muted">None noted.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {interview.overallScore !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Overall interview score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 pt-2">
                <ScoreGauge score={interview.overallScore} label="Overall" size={120} strokeWidth={11} />
              </CardContent>
            </Card>
          )}

          {interview.competencyScores && (
            <Card>
              <CardHeader>
                <CardTitle>Competency rubric</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {interview.competencyScores.map((c) => (
                  <FitScoreBar key={c.competency} label={c.competency} value={c.score} />
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Questions asked</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {interview.questions.map((q, i) => (
                <div key={q.id} className="rounded-md border border-line p-2.5">
                  <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-eyebrow text-muted">
                    Question {i + 1} · {q.type === "technical" ? "Technical" : "Behavioral"}
                  </p>
                  <p className="text-[12.5px] leading-relaxed text-ink">{q.prompt}</p>
                  {q.targetGap && <p className="mt-1 text-[11px] text-muted">Targets resume gap: {q.targetGap}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
