import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Briefcase, ClipboardList, Sparkles, Users, Video } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiTile } from "@/components/charts/KpiTile";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { ScoreBadge } from "@/components/ai/ScoreBadge";
import { AiGeneratedTag } from "@/components/ai/AiGeneratedTag";
import * as jobsService from "@/services/jobsService";
import * as candidatesService from "@/services/candidatesService";
import * as interviewsService from "@/services/interviewsService";
import * as analyticsService from "@/services/analyticsService";
import * as notificationsService from "@/services/notificationsService";
import { useAuth } from "@/hooks/useAuth";
import type { AnalyticsSnapshot, Candidate, Interview, Job, Notification } from "@/types";

export function RecruiterDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    Promise.all([
      jobsService.getJobs(),
      candidatesService.getCandidates(),
      interviewsService.getInterviews(),
      analyticsService.getAnalyticsSnapshot(),
      notificationsService.getNotifications("recruiter"),
    ]).then(([j, c, i, a, n]) => {
      setJobs(j);
      setCandidates(c);
      setInterviews(i);
      setAnalytics(a);
      setNotifications(n);
      setLoading(false);
    });
  }, []);

  const openJobs = jobs.filter((j) => j.status === "open").length;
  const decisionQueue = interviews.filter((i) => i.status === "completed" && i.recommendation).slice(0, 4);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0]}`}
        description="Here's what's happening across your open roles today."
        actions={
          <Button asChild>
            <Link to="/jobs">
              <Briefcase className="size-4" /> Post a job
            </Link>
          </Button>
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Open jobs" value={String(openJobs)} icon={Briefcase} />
            <KpiTile label="Total applicants" value={String(analytics?.totalApplicants ?? candidates.length)} icon={Users} trend={8.2} />
            <KpiTile label="Interviews scheduled" value={String(analytics?.interviewsScheduled ?? 0)} icon={Video} />
            <KpiTile label="Avg. Fit Score" value={String(analytics?.avgFitScore ?? 0)} icon={Sparkles} trend={4.1} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>Needs your decision</CardTitle>
                  <p className="mt-1 text-body-md text-muted">Candidates with completed interviews awaiting a hiring decision.</p>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {decisionQueue.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardList className="size-5" />}
                    title="You're all caught up"
                    description="No candidates are currently awaiting a decision."
                  />
                ) : (
                  <ul className="divide-y divide-line">
                    {decisionQueue.map((interview) => {
                      const candidate = candidates.find((c) => c.id === interview.candidateId);
                      if (!candidate) return null;
                      return (
                        <li key={interview.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                          <Avatar name={candidate.name} color={candidate.avatarColor} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-heading">{candidate.name}</p>
                            <p className="truncate text-[12px] text-muted">{interview.jobTitle}</p>
                          </div>
                          <ScoreBadge score={candidate.fitScore.overall} />
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/interviews/${interview.id}/results`}>Review</Link>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline health</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">{analytics && <FunnelChart data={analytics.funnel} />}</CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent AI activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="divide-y divide-line">
                {notifications.slice(0, 5).map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-sunken text-muted">
                      <Bell className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-heading">{n.title}</p>
                        {n.aiGenerated && <AiGeneratedTag label="AI" className="px-2 py-0.5 text-[10px]" />}
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>
                      <p className="mt-1 text-[11px] text-muted">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-[280px] lg:col-span-2" />
        <Skeleton className="h-[280px]" />
      </div>
    </div>
  );
}
