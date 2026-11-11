import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, Award, Bell, Briefcase, CalendarClock, ClipboardList, FileText, Search, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ai/StatusPill";
import { KpiTile } from "@/components/charts/KpiTile";
import * as applicationsService from "@/services/applicationsService";
import * as assessmentsService from "@/services/assessmentsService";
import * as notificationsService from "@/services/notificationsService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type Application, type Assessment, type Notification, type PipelineStage } from "@/types";

type ApplicationWithInterview = Application & { interviewDetails: NonNullable<Application["interviewDetails"]> };

type NextStep =
  | { kind: "interview"; app: ApplicationWithInterview }
  | { kind: "assessment"; assessment: Assessment }
  | { kind: "status"; app: Application };

type UpcomingItem = { kind: "interview"; app: ApplicationWithInterview } | { kind: "assessment"; assessment: Assessment };

function MiniStageProgress({ stage }: { stage: PipelineStage }) {
  const index = PIPELINE_STAGES.indexOf(stage);
  return (
    <div className="flex items-center gap-1" title={PIPELINE_STAGE_LABELS[stage]}>
      {PIPELINE_STAGES.map((s, i) => (
        <div key={s} className={cn("h-1.5 flex-1 rounded-pill", index >= 0 && i <= index ? "bg-primary" : "bg-line")} />
      ))}
    </div>
  );
}

export function CandidateDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      applicationsService.getApplicationsByCandidateId(user.id),
      assessmentsService.getAssessments(),
      notificationsService.getNotifications("candidate"),
    ]).then(([apps, assess, notifs]) => {
      setApplications(apps);
      setAssessments(assess.filter((a) => apps.some((app) => app.jobId === a.jobId) && a.status === "published"));
      setNotifications(notifs);
      setLoading(false);
    });
  }, [user]);

  const activeApplications = applications.filter((a) => a.stage !== "rejected" && a.stage !== "hired");
  const interviewsScheduledCount = applications.filter((a) => a.stage === "interview").length;
  const offersCount = applications.filter((a) => a.stage === "offer").length;

  const interviewApps = activeApplications
    .filter((a): a is ApplicationWithInterview => a.stage === "interview" && !!a.interviewDetails)
    .sort((a, b) => new Date(a.interviewDetails.date).getTime() - new Date(b.interviewDetails.date).getTime());

  const dueAssessments = [...assessments].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const mostRecentActiveApp = [...activeApplications].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  const nextStep: NextStep | null = interviewApps[0]
    ? { kind: "interview", app: interviewApps[0] }
    : dueAssessments[0]
      ? { kind: "assessment", assessment: dueAssessments[0] }
      : mostRecentActiveApp
        ? { kind: "status", app: mostRecentActiveApp }
        : null;

  const upcomingInterviews = nextStep?.kind === "interview" ? interviewApps.slice(1) : interviewApps;
  const upcomingAssessments = nextStep?.kind === "assessment" ? dueAssessments.slice(1) : dueAssessments;
  const upcomingItems: UpcomingItem[] = [
    ...upcomingInterviews.map((app) => ({ kind: "interview" as const, app })),
    ...upcomingAssessments.map((assessment) => ({ kind: "assessment" as const, assessment })),
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0]}`}
        description="Track your applications and stay on top of what's next."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/my-applications">
                <FileText className="size-4" /> View all applications
              </Link>
            </Button>
            <Button asChild>
              <Link to="/find-jobs">
                <Search className="size-4" /> Find jobs
              </Link>
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px]" />
            ))}
          </div>
          <Skeleton className="h-[110px]" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-[260px] lg:col-span-2" />
            <Skeleton className="h-[260px]" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Active Applications" value={String(activeApplications.length)} icon={Briefcase} />
            <KpiTile label="Interviews Scheduled" value={String(interviewsScheduledCount)} icon={CalendarClock} />
            <KpiTile label="Assessments Pending" value={String(assessments.length)} icon={ClipboardList} />
            <KpiTile label="Offers" value={String(offersCount)} icon={Award} />
          </div>

          <Card className="mb-6 mt-6 border-2 border-primary/20 dark:border-primary/25">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-primary">Next step</p>

              {!nextStep ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[13.5px] text-ink">No active next steps right now. Explore open roles to keep things moving.</p>
                  <Button size="sm" asChild>
                    <Link to="/find-jobs">
                      Find jobs <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              ) : nextStep.kind === "interview" ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-heading">Interview — {nextStep.app.jobTitle}</p>
                    <p className="mt-1 text-[13px] text-ink">
                      {format(new Date(nextStep.app.interviewDetails.date), "MMM d, yyyy")} at {nextStep.app.interviewDetails.time} with{" "}
                      {nextStep.app.interviewDetails.interviewerName}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {nextStep.app.company} · {nextStep.app.interviewDetails.interviewType}
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/my-applications">
                      View interview <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              ) : nextStep.kind === "assessment" ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-heading">{nextStep.assessment.title}</p>
                    <p className="mt-1 text-[13px] text-ink">
                      {nextStep.assessment.jobTitle}
                      {nextStep.assessment.dueDate ? ` · Due ${format(new Date(nextStep.assessment.dueDate), "MMM d, yyyy")}` : ""}
                    </p>
                  </div>
                  <Button asChild>
                    <Link to={`/assessments/${nextStep.assessment.id}/take`}>
                      Start assessment <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-heading">{nextStep.app.jobTitle}</p>
                    <p className="mt-1 text-[13px] text-ink">
                      Your application is currently in the <span className="font-medium">{PIPELINE_STAGE_LABELS[nextStep.app.stage]}</span> stage.
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to="/my-applications">
                      View application <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Your active applications</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {activeApplications.length === 0 ? (
                  <EmptyState
                    icon={<Briefcase className="size-5" />}
                    title="No active applications"
                    description="Browse open roles to get started."
                    action={
                      <Button size="sm" asChild>
                        <Link to="/find-jobs">Find jobs</Link>
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {activeApplications.map((app) => (
                      <li key={app.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-heading">{app.jobTitle}</p>
                            <p className="truncate text-[12px] text-muted">
                              {app.company} · {app.location}
                            </p>
                          </div>
                          <StatusPill stage={app.stage} className="shrink-0" />
                        </div>
                        <div className="mt-2.5">
                          <MiniStageProgress stage={app.stage} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action required</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {assessments.length === 0 ? (
                  <EmptyState icon={<ClipboardList className="size-5" />} title="Nothing pending" description="You're all caught up." />
                ) : (
                  <ul className="space-y-3">
                    {assessments.map((a) => (
                      <li key={a.id} className="rounded-md border border-line p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium text-heading">{a.title}</p>
                          <Badge variant="warning" className="shrink-0">
                            Pending
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted">{a.jobTitle}</p>
                        {a.dueDate && <p className="mt-0.5 text-[11px] text-muted">Due {format(new Date(a.dueDate), "MMM d, yyyy")}</p>}
                        <Button size="sm" variant="outline" className="mt-2.5 w-full" asChild>
                          <Link to={`/assessments/${a.id}/take`}>Start assessment</Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {upcomingItems.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Upcoming</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="divide-y divide-line">
                  {upcomingItems.map((item) =>
                    item.kind === "interview" ? (
                      <li key={`interview-${item.app.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-heading">Interview — {item.app.jobTitle}</p>
                          <p className="text-[12px] text-muted">
                            {format(new Date(item.app.interviewDetails.date), "MMM d, yyyy")} at {item.app.interviewDetails.time}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/my-applications">View interview</Link>
                        </Button>
                      </li>
                    ) : (
                      <li key={`assessment-${item.assessment.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-heading">{item.assessment.title}</p>
                          <p className="text-[12px] text-muted">
                            {item.assessment.dueDate ? `Due ${format(new Date(item.assessment.dueDate), "MMM d, yyyy")}` : item.assessment.jobTitle}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/assessments/${item.assessment.id}/take`}>Start assessment</Link>
                        </Button>
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent updates</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {notifications.length === 0 ? (
                <EmptyState icon={<Bell className="size-5" />} title="No updates yet" />
              ) : (
                <>
                  <ul className="divide-y divide-line">
                    {notifications.slice(0, 3).map((n) => (
                      <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-sunken text-muted">
                          <Bell className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-heading">{n.title}</p>
                          <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>
                          <p className="mt-1 text-[11px] text-muted">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Button variant="link" size="sm" className="mt-1" asChild>
                    <Link to="/notifications">View all notifications</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 border-none bg-gradient-brand-soft dark:bg-sunken">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-xs">
                  <UploadCloud className="size-4" />
                </div>
                <p className="text-[12.5px] text-ink">Looking for another opportunity? Apply faster with Quick Apply.</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link to="/quick-apply">
                  Get started <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
