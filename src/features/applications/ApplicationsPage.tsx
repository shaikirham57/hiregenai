import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Award,
  Briefcase,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Mail,
  Phone,
  User,
  UserCog,
  Video,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { StatusPill } from "@/components/ai/StatusPill";
import { ScoreBadge } from "@/components/ai/ScoreBadge";
import { KpiTile } from "@/components/charts/KpiTile";
import * as applicationsService from "@/services/applicationsService";
import * as jobsService from "@/services/jobsService";
import * as assessmentsService from "@/services/assessmentsService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { colorForSeed } from "@/lib/constants";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type Application, type Assessment, type Job } from "@/types";

type NextAction = {
  icon: typeof Clock;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobsById, setJobsById] = useState<Record<string, Job>>({});
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "applied" | "screened" | "interview" | "offer" | "hired">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [interviewApp, setInterviewApp] = useState<Application | null>(null);

  useEffect(() => {
    if (!user) return;
    applicationsService.getApplicationsByCandidateId(user.id).then(async (data) => {
      setApplications(data);

      const [jobEntries, allAssessments] = await Promise.all([
        Promise.all(data.map(async (a) => [a.jobId, await jobsService.getJobById(a.jobId)] as const)),
        assessmentsService.getAssessments(),
      ]);
      const jobMap: Record<string, Job> = {};
      jobEntries.forEach(([jobId, job]) => {
        if (job) jobMap[jobId] = job;
      });
      setJobsById(jobMap);
      setAssessments(allAssessments.filter((a) => data.some((app) => app.jobId === a.jobId) && a.status === "published"));
      setLoading(false);
    });
  }, [user]);

  const counts = {
    applied: applications.filter((a) => a.stage === "applied").length,
    screened: applications.filter((a) => a.stage === "screened").length,
    interview: applications.filter((a) => a.stage === "interview").length,
    offer: applications.filter((a) => a.stage === "offer").length,
    hired: applications.filter((a) => a.stage === "hired").length,
  };
  const underReviewCount = counts.applied + counts.screened;

  const getNextAction = (app: Application): NextAction => {
    if (app.stage === "hired") {
      return { icon: CheckCircle2, text: "Congratulations — you were hired for this role!" };
    }
    if (app.stage === "rejected") {
      return { icon: XCircle, text: "This application is closed. The team moved forward with other candidates." };
    }
    if (app.stage === "offer") {
      return { icon: Award, text: "You have an offer for this role — the team will follow up with next steps." };
    }
    if (app.stage === "interview" && app.interviewDetails) {
      return {
        icon: CalendarClock,
        text: `Interview on ${format(new Date(app.interviewDetails.date), "MMM d, yyyy")} at ${app.interviewDetails.time} with ${app.interviewDetails.interviewerName}`,
        ctaLabel: "View interview",
        onCta: () => setInterviewApp(app),
      };
    }
    const matchedAssessment = assessments.find((a) => a.jobId === app.jobId);
    if (matchedAssessment) {
      return {
        icon: ClipboardList,
        text: `Complete the ${matchedAssessment.title} to move forward.`,
        ctaLabel: "Start assessment",
        ctaHref: `/assessments/${matchedAssessment.id}/take`,
      };
    }
    return { icon: Clock, text: "Application under review — no action needed right now." };
  };

  const renderList = (items: Application[]) =>
    items.length === 0 ? (
      <EmptyState icon={<Briefcase className="size-5" />} title="No applications in this view" description="Try a different filter." />
    ) : (
      <div className="space-y-4">
        {items.map((app) => {
          const expanded = expandedId === app.id;
          const job = jobsById[app.jobId];
          const action = getNextAction(app);
          const ActionIcon = action.icon;

          return (
            <Card key={app.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-heading">{app.jobTitle}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {app.company} · {app.location}
                    {job?.employmentType ? ` · ${job.employmentType}` : ""}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted">Applied {format(new Date(app.appliedAt), "MMM d, yyyy")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {app.matchScore !== undefined && <ScoreBadge score={app.matchScore} />}
                  <StatusPill stage={app.stage} className="px-2.5 py-1 text-[12.5px]" />
                </div>
              </div>

              <CompactStageTimeline application={app} />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-sunken/40 p-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-xs">
                    <ActionIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-eyebrow text-muted">Next action</p>
                    <p className="truncate text-[12.5px] text-ink">{action.text}</p>
                  </div>
                </div>
                {action.ctaLabel &&
                  (action.ctaHref ? (
                    <Button size="sm" asChild className="shrink-0">
                      <Link to={action.ctaHref}>{action.ctaLabel} →</Link>
                    </Button>
                  ) : (
                    <Button size="sm" onClick={action.onCta} className="shrink-0">
                      {action.ctaLabel} →
                    </Button>
                  ))}
              </div>

              {(app.personalInfo || app.background || (app.screeningAnswers && app.screeningAnswers.length > 0)) && (
                <div className="mt-4 border-t border-line pt-3">
                  <Button variant="outline" size="sm" onClick={() => setExpandedId(expanded ? null : app.id)}>
                    <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
                    {expanded ? "Hide application details" : "View application details"}
                  </Button>

                  {expanded && (
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {app.personalInfo && (
                        <div className="rounded-md border border-line p-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Personal info</p>
                          <p className="text-[13px] text-ink">{app.personalInfo.fullName}</p>
                          <p className="text-[12.5px] text-muted">{app.personalInfo.email}</p>
                          <p className="text-[12.5px] text-muted">{app.personalInfo.phone}</p>
                          <p className="text-[12.5px] text-muted">{app.personalInfo.location}</p>
                          {(app.personalInfo.linkedIn || app.personalInfo.github || app.personalInfo.portfolio) && (
                            <div className="mt-2 flex flex-wrap gap-3 border-t border-line pt-2">
                              {app.personalInfo.linkedIn && (
                                <a href={app.personalInfo.linkedIn} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-primary hover:underline">
                                  LinkedIn
                                </a>
                              )}
                              {app.personalInfo.github && (
                                <a href={app.personalInfo.github} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-primary hover:underline">
                                  GitHub
                                </a>
                              )}
                              {app.personalInfo.portfolio && (
                                <a href={app.personalInfo.portfolio} target="_blank" rel="noreferrer" className="text-[12px] font-medium text-primary hover:underline">
                                  Portfolio
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {app.background && (
                        <div className="rounded-md border border-line p-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Education &amp; experience</p>
                          <p className="text-[13px] text-ink">{app.background.education}</p>
                          {app.background.college && <p className="text-[12.5px] text-muted">{app.background.college}</p>}
                          <p className="text-[12.5px] text-muted">{app.background.isFresher ? "Fresher" : `${app.background.yearsExperience} years of experience`}</p>
                          {!app.background.isFresher && app.background.previousRole && (
                            <p className="text-[12.5px] text-muted">
                              {app.background.previousRole}
                              {app.background.previousCompany ? ` at ${app.background.previousCompany}` : ""}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {app.background.skills.map((s) => (
                              <Badge key={s} variant="neutral">
                                {s}
                              </Badge>
                            ))}
                          </div>
                          {app.background.coverLetter && (
                            <p className="mt-2 whitespace-pre-line border-t border-line pt-2 text-[12.5px] text-ink">{app.background.coverLetter}</p>
                          )}
                        </div>
                      )}
                      {app.screeningAnswers && app.screeningAnswers.length > 0 && (
                        <div className="rounded-md border border-line p-3 sm:col-span-2">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Screening answers</p>
                          {app.screeningAnswers.map((qa, i) => (
                            <div key={i} className="mb-2 last:mb-0">
                              <p className="text-[12px] font-medium text-muted">{qa.question}</p>
                              <p className="text-[13px] text-ink">{qa.answer || "—"}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );

  return (
    <div>
      <PageHeader title="My Applications" description="Track the status of every role you've applied to." />

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px]" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="size-5" />}
          title="No applications yet"
          description="Explore open roles to get started."
          action={
            <Button size="sm" asChild>
              <Link to="/find-jobs">Find jobs</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Total Applications" value={String(applications.length)} icon={Briefcase} />
            <KpiTile label="Interviews" value={String(counts.interview)} icon={CalendarClock} />
            <KpiTile label="Under Review" value={String(underReviewCount)} icon={Clock} />
            <KpiTile label="Offers" value={String(counts.offer)} icon={Award} />
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="mb-5 flex-wrap">
              <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
              <TabsTrigger value="applied">Applied ({counts.applied})</TabsTrigger>
              <TabsTrigger value="screened">Screened ({counts.screened})</TabsTrigger>
              <TabsTrigger value="interview">Interview ({counts.interview})</TabsTrigger>
              <TabsTrigger value="offer">Offer ({counts.offer})</TabsTrigger>
              <TabsTrigger value="hired">Hired ({counts.hired})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderList(applications)}</TabsContent>
            <TabsContent value="applied">{renderList(applications.filter((a) => a.stage === "applied"))}</TabsContent>
            <TabsContent value="screened">{renderList(applications.filter((a) => a.stage === "screened"))}</TabsContent>
            <TabsContent value="interview">{renderList(applications.filter((a) => a.stage === "interview"))}</TabsContent>
            <TabsContent value="offer">{renderList(applications.filter((a) => a.stage === "offer"))}</TabsContent>
            <TabsContent value="hired">{renderList(applications.filter((a) => a.stage === "hired"))}</TabsContent>
          </Tabs>
        </>
      )}

      <Modal open={!!interviewApp} onOpenChange={(open) => !open && setInterviewApp(null)}>
        {interviewApp?.interviewDetails && (
          <ModalContent
            title="Interview Details"
            description={`${interviewApp.jobTitle} · ${interviewApp.company}`}
            className="max-w-xl"
          >
            <InterviewDetailsView details={interviewApp.interviewDetails} />
          </ModalContent>
        )}
      </Modal>
    </div>
  );
}

function InterviewDetailsView({ details }: { details: NonNullable<Application["interviewDetails"]> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-line p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">
            <User className="size-3.5" /> Interviewer
          </p>
          <div className="flex items-center gap-2.5">
            <Avatar name={details.interviewerName} color={colorForSeed(details.interviewerName)} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-heading">{details.interviewerName}</p>
              <p className="truncate text-[12px] text-muted">{details.interviewerRole}</p>
              <p className="truncate text-[12px] text-muted">{details.interviewerCompany}</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-line bg-sunken/50 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">
            <UserCog className="size-3.5" /> Scheduled / Assigned By
          </p>
          <div className="flex items-center gap-2.5">
            <Avatar name={details.scheduledByName} color={colorForSeed(details.scheduledByName)} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-heading">{details.scheduledByName}</p>
              <p className="truncate text-[12px] text-muted">{details.scheduledByRole}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line p-3">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Schedule</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <Calendar className="size-3.5" /> Date
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink">{details.date}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <Clock className="size-3.5" /> Time
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink">{details.time}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <Video className="size-3.5" /> Interview Type
            </p>
            <p className="mt-1 text-[13px] font-medium text-ink">{details.interviewType}</p>
          </div>
        </div>
        {details.meetingLink && (
          <div className="mt-3 border-t border-line pt-3">
            <Button asChild size="sm">
              <a href={details.meetingLink} target="_blank" rel="noreferrer">
                <Video className="size-3.5" /> Join Meeting
              </a>
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border border-line p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Recruiter Contact</p>
        <p className="text-[13px] font-medium text-ink">{details.recruiterContactName}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          <a
            href={`mailto:${details.recruiterContactEmail}`}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:underline"
          >
            <Mail className="size-3.5" /> {details.recruiterContactEmail}
          </a>
          {details.recruiterContactPhone && (
            <a
              href={`tel:${details.recruiterContactPhone}`}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:underline"
            >
              <Phone className="size-3.5" /> {details.recruiterContactPhone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function Timeline({ application }: { application: Application }) {
  const isRejected = application.stage === "rejected";
  const stages = isRejected ? [...PIPELINE_STAGES.slice(0, application.timeline.length - 1), "rejected" as const] : PIPELINE_STAGES;
  const reachedIndex = application.timeline.length - 1;

  return (
    <div className="mt-6 flex items-start gap-0 overflow-x-auto pb-1">
      {stages.map((stage, i) => {
        const entry = application.timeline.find((t) => t.stage === stage);
        const reached = i <= reachedIndex;
        return (
          <div key={stage} className="flex min-w-[110px] flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={cn("h-0.5 flex-1", i === 0 ? "invisible" : reached ? "bg-primary" : "bg-line")} />
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  reached ? (stage === "rejected" ? "bg-error text-white" : "bg-primary text-white") : "bg-sunken text-muted"
                )}
              >
                {reached ? <Check className="size-3.5" /> : i + 1}
              </div>
              <div className={cn("h-0.5 flex-1", i === stages.length - 1 ? "invisible" : reached && i < reachedIndex ? "bg-primary" : "bg-line")} />
            </div>
            <p className={cn("mt-2 text-[12px] font-medium", reached ? "text-heading" : "text-muted")}>{PIPELINE_STAGE_LABELS[stage]}</p>
            {entry && <p className="mt-0.5 text-[11px] text-muted">{entry.date}</p>}
            {entry?.note && <CardContent className="mt-1 max-w-[150px] p-0 text-[10.5px] leading-snug text-muted">{entry.note}</CardContent>}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact stage progress used inside My Applications cards: distinguishes completed stages
 * (filled + check), the current stage (filled + dot), and upcoming stages (hollow) at a glance.
 * Kept separate from the fuller `Timeline` above, which Job Details still uses for its own
 * "What happens next?" section.
 */
function CompactStageTimeline({ application }: { application: Application }) {
  const isRejected = application.stage === "rejected";
  const stages = isRejected ? [...PIPELINE_STAGES.slice(0, application.timeline.length - 1), "rejected" as const] : PIPELINE_STAGES;
  const reachedIndex = application.timeline.length - 1;

  return (
    <div className="mt-3 flex items-start gap-0 overflow-x-auto pb-0.5">
      {stages.map((stage, i) => {
        const done = i < reachedIndex;
        const current = i === reachedIndex;
        const isError = stage === "rejected";
        return (
          <div key={stage} className="flex min-w-[76px] flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={cn("h-0.5 flex-1", i === 0 ? "invisible" : i <= reachedIndex ? (isError && i === reachedIndex ? "bg-error" : "bg-primary") : "bg-line")} />
              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  done
                    ? cn("text-white", isError ? "bg-error" : "bg-primary")
                    : current
                      ? cn(isError ? "bg-error" : "bg-primary")
                      : "border border-line-strong bg-surface"
                )}
              >
                {done && <Check className="size-3" />}
                {current && <span className="size-1.5 rounded-full bg-white" />}
              </div>
              <div className={cn("h-0.5 flex-1", i === stages.length - 1 ? "invisible" : i < reachedIndex ? "bg-primary" : "bg-line")} />
            </div>
            <p className={cn("mt-1.5 text-[10.5px] font-medium leading-tight", done || current ? "text-heading" : "text-muted")}>
              {PIPELINE_STAGE_LABELS[stage]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
