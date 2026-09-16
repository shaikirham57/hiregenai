import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, CheckCircle2, ClipboardList, Clock, ListChecks, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { KpiTile } from "@/components/charts/KpiTile";
import * as assessmentsService from "@/services/assessmentsService";
import * as applicationsService from "@/services/applicationsService";
import * as jobsService from "@/services/jobsService";
import { useAuth } from "@/hooks/useAuth";
import { getAssessmentProgress, type AssessmentProgressStatus } from "@/lib/assessmentProgress";
import type { Assessment, Job } from "@/types";

function estimatedMinutes(a: Assessment) {
  return Math.max(10, a.questions.length * 4);
}

function assessmentType(a: Assessment) {
  const hasMcq = a.questions.some((q) => q.type === "mcq");
  const hasBehavioral = a.questions.some((q) => q.type === "behavioral");
  if (hasMcq && hasBehavioral) return "Mixed (MCQ + Behavioral)";
  if (hasMcq) return "Multiple choice only";
  return "Written response only";
}

const STATUS_BADGE: Record<AssessmentProgressStatus, { label: string; variant: "warning" | "primary" | "success" }> = {
  not_started: { label: "Not started", variant: "warning" },
  in_progress: { label: "In progress", variant: "primary" },
  completed: { label: "Completed", variant: "success" },
};

export function CandidateAssessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [jobsById, setJobsById] = useState<Record<string, Job>>({});
  const [loading, setLoading] = useState(true);
  // Re-render whenever the tab regains focus, since progress can change on the take-assessment page.
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([applicationsService.getApplicationsByCandidateId(user.id), assessmentsService.getAssessments()]).then(async ([apps, all]) => {
      const matched = all.filter((a) => apps.some((app) => app.jobId === a.jobId) && a.status === "published");
      setAssessments(matched);

      const jobEntries = await Promise.all(matched.map(async (a) => [a.jobId, await jobsService.getJobById(a.jobId)] as const));
      const jobMap: Record<string, Job> = {};
      jobEntries.forEach(([jobId, job]) => {
        if (job) jobMap[jobId] = job;
      });
      setJobsById(jobMap);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    const onFocus = () => forceRefresh((t) => t + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const totalMinutes = assessments.reduce((sum, a) => sum + estimatedMinutes(a), 0);
  const completedCount = assessments.filter((a) => getAssessmentProgress(a.id).status === "completed").length;

  return (
    <div>
      <PageHeader title="Assessments" description="Complete these to move forward in your applications." />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px]" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : assessments.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-5" />} title="Nothing pending" description="You're all caught up on assessments." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiTile label="Total Assessments" value={String(assessments.length)} icon={ClipboardList} />
            <KpiTile label="Completed" value={String(completedCount)} icon={CheckCircle2} />
            <KpiTile label="Est. Time Remaining" value={`${totalMinutes} min`} icon={Clock} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {assessments.map((a) => {
              const mcqCount = a.questions.filter((q) => q.type === "mcq").length;
              const behavioralCount = a.questions.filter((q) => q.type === "behavioral").length;
              const progress = getAssessmentProgress(a.id);
              const statusMeta = STATUS_BADGE[progress.status];
              const job = jobsById[a.jobId];

              return (
                <Card key={a.id} className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-heading">{a.title}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-muted">{a.jobTitle}</p>
                    </div>
                    <Badge variant={statusMeta.variant} className="shrink-0">
                      {statusMeta.label}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
                    <span className="flex items-center gap-1.5">
                      <ListChecks className="size-3.5" />
                      {mcqCount > 0 && behavioralCount > 0
                        ? `${mcqCount} MCQ · ${behavioralCount} Behavioral`
                        : `${a.questions.length} question${a.questions.length === 1 ? "" : "s"}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />~{estimatedMinutes(a)} min
                    </span>
                    {a.dueDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        Due {format(new Date(a.dueDate), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[11.5px] text-muted">{assessmentType(a)} · Required for your {a.jobTitle} application</p>

                  {job && job.skills.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="neutral">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <CardContent className="mt-3 flex items-center gap-1.5 rounded-md bg-sunken/50 px-3 py-2 text-[12px] text-ink">
                    <Sparkles className="size-3.5 shrink-0 text-accent" />
                    Counts for {a.weightInFitScore}% of your Fit Score for this role
                  </CardContent>

                  {progress.status === "completed" ? (
                    <Button variant="outline" className="mt-4 w-full" asChild>
                      <Link to={`/assessments/${a.id}/take`}>View submission →</Link>
                    </Button>
                  ) : progress.status === "in_progress" ? (
                    <Button className="mt-4 w-full" asChild>
                      <Link to={`/assessments/${a.id}/take`}>Continue assessment →</Link>
                    </Button>
                  ) : (
                    <Button className="mt-4 w-full" asChild>
                      <Link to={`/assessments/${a.id}/take`}>Start assessment →</Link>
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
