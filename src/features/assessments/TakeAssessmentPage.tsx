import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Check, CheckCircle2, ListChecks, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import * as assessmentsService from "@/services/assessmentsService";
import { getAssessmentProgress, saveAssessmentProgress } from "@/lib/assessmentProgress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import type { Assessment } from "@/types";

function estimatedMinutes(a: Assessment) {
  return Math.max(10, a.questions.length * 4);
}

export default function TakeAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | undefined>();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"take" | "review" | "submitted">("take");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    assessmentsService.getAssessmentById(id).then((a) => {
      setAssessment(a);
      if (a) {
        const progress = getAssessmentProgress(a.id);
        if (progress.status === "completed") {
          setAnswers(progress.answers ?? {});
          setCompletedAt(progress.completedAt);
          setMode("review");
        } else {
          setAnswers(progress.answers ?? {});
          setCurrentIndex(progress.currentIndex ?? 0);
          setMode("take");
          if (progress.status === "not_started") {
            saveAssessmentProgress(a.id, { status: "in_progress", answers: {}, currentIndex: 0 });
          }
        }
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <EmptyState
        title="Assessment not found"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/assessments">Back to assessments</Link>
          </Button>
        }
      />
    );
  }

  const questions = assessment.questions;
  const total = questions.length;
  const answeredCount = questions.filter((q) => answers[q.id]?.trim()).length;
  const allAnswered = answeredCount === total;

  const persistSilently = (nextAnswers: Record<string, string>, nextIndex: number) => {
    saveAssessmentProgress(assessment.id, { status: "in_progress", answers: nextAnswers, currentIndex: nextIndex });
  };

  const setAnswer = (questionId: string, value: string) => {
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);
    persistSilently(nextAnswers, currentIndex);
  };

  const goTo = (index: number) => {
    persistSilently(answers, index);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
    setCurrentIndex(index);
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const now = new Date().toISOString();
    saveAssessmentProgress(assessment.id, { status: "completed", answers, completedAt: now });
    setCompletedAt(now);
    setSubmitting(false);
    setConfirmOpen(false);
    setMode("submitted");
    toast({ title: "Assessment submitted", description: "The recruiting team will review your results shortly.", variant: "success" });
  };

  if (mode === "submitted" || mode === "review") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-score-strong-bg text-score-strong">
            <CheckCircle2 className="size-7" />
          </div>
          <Badge variant="success">Completed</Badge>
          <h1 className="font-display text-h1 font-bold text-heading">
            {mode === "submitted" ? "Assessment submitted" : "You already completed this assessment"}
          </h1>
          <p className="max-w-md text-body-md text-muted">
            {mode === "submitted"
              ? `Thanks for completing the ${assessment.title}. Your responses have been recorded and will be factored into your overall application review.`
              : `Your responses to the ${assessment.title} for ${assessment.jobTitle} have already been submitted.`}
          </p>
          {completedAt && <p className="text-[12px] text-muted">Completed {format(new Date(completedAt), "MMM d, yyyy 'at' h:mm a")}</p>}
        </div>

        <Card className="mb-6">
          <CardContent className="p-5">
            <p className="mb-4 text-[13px] font-semibold text-heading">Your submitted responses</p>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={q.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                  <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">
                    Question {i + 1} · {q.type === "mcq" ? "Multiple Choice" : "Behavioral"}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-ink">{q.prompt}</p>
                  <p className="mt-1 text-[13px] text-muted">{answers[q.id] || "—"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" asChild>
            <Link to="/assessments">Back to assessments →</Link>
          </Button>
          <Button asChild>
            <Link to="/my-applications">View application →</Link>
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLast = currentIndex === total - 1;
  const unansweredCount = total - answeredCount;

  return (
    <div>
      <PageHeader title={assessment.title} description={assessment.jobTitle} />

      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-heading">
                Question {currentIndex + 1} of {total}
              </p>
              <p className="text-[12px] text-muted">
                {answeredCount} of {total} answered · Est. {estimatedMinutes(assessment)} min total
              </p>
            </div>
            {justSaved && (
              <span className="flex items-center gap-1 text-[12px] font-medium text-score-strong">
                <Check className="size-3.5" /> Answers saved
              </span>
            )}
          </div>
          <Progress value={((currentIndex + 1) / total) * 100} className="mt-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card className="p-6">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">
              {question.type === "mcq" ? <ListChecks className="size-3.5" /> : <MessageSquare className="size-3.5" />}
              Question {currentIndex + 1} · {question.type === "mcq" ? "Multiple Choice" : "Behavioral"}
            </p>
            <p className="text-[15px] font-medium leading-relaxed text-heading">{question.prompt}</p>

            {question.type === "mcq" && question.options ? (
              <div className="mt-4 space-y-2">
                {question.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2.5 rounded-md border border-line-strong p-2.5 text-[13px] text-ink transition-colors hover:bg-sunken has-[:checked]:border-primary has-[:checked]:bg-brand-blue-100 dark:has-[:checked]:bg-primary/10"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={opt}
                      checked={answers[question.id] === opt}
                      onChange={() => setAnswer(question.id, opt)}
                      className="accent-[var(--color-primary)]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <Textarea
                rows={6}
                className="mt-4"
                placeholder="Share your answer..."
                value={answers[question.id] ?? ""}
                onChange={(e) => setAnswer(question.id, e.target.value)}
              />
            )}
          </Card>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0}>
              Previous
            </Button>
            {isLast ? (
              <Button onClick={() => setConfirmOpen(true)}>Review &amp; Submit →</Button>
            ) : (
              <Button onClick={() => goTo(currentIndex + 1)}>Save &amp; Continue →</Button>
            )}
          </div>
        </div>

        <div>
          <Card className="p-4 lg:sticky lg:top-6">
            <p className="mb-3 text-[12px] font-semibold text-heading">Questions</p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-4">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id]?.trim();
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => goTo(i)}
                    aria-label={`Go to question ${i + 1}${isAnswered ? " (answered)" : ""}`}
                    className={cn(
                      "relative flex size-9 items-center justify-center rounded-md border text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-[var(--ring-accent)]",
                      isCurrent
                        ? "border-primary bg-primary text-white"
                        : isAnswered
                          ? "border-score-strong/40 bg-score-strong-bg text-score-strong"
                          : "border-line-strong text-muted hover:bg-sunken"
                    )}
                  >
                    {i + 1}
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-surface shadow-xs",
                        isCurrent ? "text-white" : q.type === "mcq" ? "text-primary" : "text-accent"
                      )}
                    >
                      {q.type === "mcq" ? <ListChecks className="size-2.5" /> : <MessageSquare className="size-2.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3.5 space-y-1.5 border-t border-line pt-3 text-[11px] text-muted">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 shrink-0 rounded-sm bg-primary" /> Current
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 shrink-0 rounded-sm border border-score-strong/40 bg-score-strong-bg" /> Answered
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 shrink-0 rounded-sm border border-line-strong" /> Unanswered
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ModalContent title="Submit assessment?" description="Review your progress before submitting.">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border border-line p-3 text-[13px]">
              <span className="text-ink">Answered</span>
              <span className="font-semibold text-score-strong">
                {answeredCount} of {total}
              </span>
            </div>
            {unansweredCount > 0 && (
              <div className="flex items-center justify-between rounded-md border border-line p-3 text-[13px]">
                <span className="text-ink">Unanswered</span>
                <span className="font-semibold text-score-weak">{unansweredCount}</span>
              </div>
            )}
            <p className="text-[12.5px] text-muted">
              {unansweredCount > 0
                ? "Answer every question before you can submit. Once submitted, your answers cannot be changed."
                : "Once submitted, your answers cannot be changed."}
            </p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={!allAnswered}>
              Submit assessment
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
