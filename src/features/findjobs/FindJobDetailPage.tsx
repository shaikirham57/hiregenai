import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Briefcase, Check, CheckCircle2, MapPin, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScoreGauge } from "@/components/ai/ScoreGauge";
import { FitScoreBar } from "@/components/ai/FitScoreBar";
import { AiGeneratedTag } from "@/components/ai/AiGeneratedTag";
import { Timeline } from "@/features/applications/ApplicationsPage";
import * as jobsService from "@/services/jobsService";
import * as applicationsService from "@/services/applicationsService";
import * as aiScoringService from "@/services/aiScoringService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { getScoreTier, SCORE_TIER_LABEL } from "@/lib/scoreTier";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type Application, type FitScoreBreakdown, type Job } from "@/types";

export default function FindJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | undefined>();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [application, setApplication] = useState<Application | undefined>();
  const [fitScore, setFitScore] = useState<FitScoreBreakdown | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([jobsService.getJobById(id), jobsService.getJobs()]).then(async ([data, all]) => {
      setJob(data);
      setAllJobs(all);

      if (data && user?.role === "candidate") {
        const applications = await applicationsService.getApplicationsByCandidateId(user.id);
        const existing = applications.find((a) => a.jobId === data.id);
        setApplication(existing);

        // Prefer this application's own background; otherwise fall back to the candidate's most
        // recently submitted background from another application, to preview a match here too.
        const profileSource = existing?.background
          ? existing
          : [...applications].filter((a) => a.background).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

        if (profileSource?.background) {
          const input = {
            skills: profileSource.background.skills,
            yearsExperience: profileSource.background.isFresher ? 0 : profileSource.background.yearsExperience,
            education: profileSource.background.education,
          };
          const fit = await aiScoringService.scoreCandidateAgainstJob(input, data);
          setFitScore(fit);
        }
      }
      setLoading(false);
    });
  }, [id, user]);

  const similarJobs = useMemo(() => {
    if (!job) return [];
    const open = allJobs.filter((j) => j.status === "open" && j.id !== job.id);
    const sameDepartment = open.filter((j) => j.department === job.department);
    const rest = open.filter((j) => j.department !== job.department);
    return [...sameDepartment, ...rest].slice(0, 3);
  }, [allJobs, job]);

  const handleApply = () => {
    if (!job) return;
    if (!user) {
      navigate("/register", { state: { from: { pathname: `/find-jobs/${job.id}/apply` } } });
      return;
    }
    if (user.role !== "candidate") {
      toast({
        title: "Log in as a candidate to apply",
        description: "You're signed in with a recruiter account. Log out and sign in as a candidate to submit an application.",
        variant: "warning",
      });
      return;
    }
    navigate(`/find-jobs/${job.id}/apply`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!job || job.status !== "open") {
    return (
      <EmptyState
        title="This role isn't accepting applications"
        description="It may have closed or been filled."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/find-jobs">Back to Find Jobs</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Link to="/find-jobs" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Back to Find Jobs
      </Link>

      <PageHeader
        title={job.title}
        description={`${job.department} · ${job.location}`}
        actions={
          application ? (
            <Button variant="outline" asChild>
              <Link to="/my-applications">View application progress</Link>
            </Button>
          ) : (
            <Button size="lg" onClick={handleApply}>
              Apply now
            </Button>
          )
        }
      />

      {application && (
        <Card className="mb-6 border-score-strong/30 bg-score-strong-bg/30 dark:bg-score-strong-bg/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-score-strong-bg text-score-strong">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-heading">Application submitted</p>
                <p className="text-[12.5px] text-muted">
                  Applied {format(new Date(application.appliedAt), "MMM d, yyyy")} · Currently in{" "}
                  <span className="font-medium text-ink">{PIPELINE_STAGE_LABELS[application.stage]}</span>
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/my-applications">View application progress</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {application ? (
            <Timeline application={application} />
          ) : (
            <>
              <div className="flex items-start gap-0 overflow-x-auto pb-1">
                {PIPELINE_STAGES.map((stage, i) => (
                  <div key={stage} className="flex min-w-[110px] flex-1 flex-col items-center text-center">
                    <div className="flex w-full items-center">
                      <div className={cn("h-0.5 flex-1", i === 0 && "invisible")} />
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sunken text-[11px] font-semibold text-muted">
                        {i + 1}
                      </div>
                      <div className={cn("h-0.5 flex-1", i === PIPELINE_STAGES.length - 1 && "invisible")} />
                    </div>
                    <p className="mt-2 text-[12px] font-medium text-muted">{PIPELINE_STAGE_LABELS[stage]}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12.5px] text-muted">Apply to start your hiring journey for this role.</p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About this role</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink">{job.description}</p>
            </CardContent>
          </Card>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="space-y-2">
                  {job.responsibilities.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-ink">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {job.qualifications && job.qualifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required qualifications</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="space-y-2">
                  {job.qualifications.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-ink">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {fitScore && (
            <Card id="why-match">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-accent" />
                  <CardTitle>Why you're a match</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-start gap-2 rounded-md border border-line bg-canvas p-3">
                  <AiGeneratedTag className="shrink-0" label="AI generated" />
                  <p className="text-[13px] leading-relaxed text-ink">{fitScore.narrative}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Skills you'll use</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5 pt-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="primary">
                  {skill}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {user?.role === "candidate" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="size-4 text-accent" /> Your AI Match
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {fitScore ? (
                  <div className="flex flex-col items-center gap-4">
                    <ScoreGauge score={fitScore.overall} label={SCORE_TIER_LABEL[getScoreTier(fitScore.overall)]} size={112} strokeWidth={10} />
                    <div className="w-full space-y-2">
                      <FitScoreBar label="Skills" value={fitScore.skills} />
                      <FitScoreBar label="Experience" value={fitScore.experience} />
                      <FitScoreBar label="Education" value={fitScore.education} />
                    </div>
                    {fitScore.matchedSkills.length > 0 && (
                      <div className="w-full">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Why you match</p>
                        <ul className="space-y-1">
                          {fitScore.matchedSkills.slice(0, 3).map((s) => (
                            <li key={s} className="flex items-center gap-1.5 text-[12.5px] text-ink">
                              <Check className="size-3.5 shrink-0 text-score-strong" /> Hands-on experience with {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {fitScore.missingSkills.length > 0 && (
                      <div className="w-full">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Skill gaps</p>
                        <div className="flex flex-wrap gap-1.5">
                          {fitScore.missingSkills.map((s) => (
                            <Badge key={s} variant="outline">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => document.getElementById("why-match")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    >
                      View full match explanation
                    </Button>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted">
                    Submit an application to unlock your AI match score for this and future roles.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Role details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-[13px]">
              <div className="flex items-center gap-2 text-ink">
                <Briefcase className="size-3.5 text-muted" /> {job.employmentType} · {job.seniority} level
              </div>
              <div className="flex items-center gap-2 text-ink">
                <MapPin className="size-3.5 text-muted" /> {job.location}
              </div>
              <div className="flex items-center gap-2 text-ink">
                <Users className="size-3.5 text-muted" /> {job.applicantCount} applicants so far
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary range</CardTitle>
              <CardDescription>{job.salaryRange.source}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between text-[12px] text-muted">
                <span>${(job.salaryRange.min / 1000).toFixed(0)}k</span>
                <span className="font-semibold text-heading">${(job.salaryRange.mid / 1000).toFixed(0)}k median</span>
                <span>${(job.salaryRange.max / 1000).toFixed(0)}k</span>
              </div>
              <div className="mt-2 h-2 rounded-pill bg-gradient-brand" />
            </CardContent>
          </Card>

          {!application && (
            <Button className="w-full" size="lg" onClick={handleApply}>
              Apply now
            </Button>
          )}
        </div>
      </div>

      {similarJobs.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Similar opportunities</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
            {similarJobs.map((j) => (
              <Link
                key={j.id}
                to={`/find-jobs/${j.id}`}
                className="rounded-md border border-line p-3 transition-colors hover:border-primary/50 hover:bg-sunken/40"
              >
                <p className="truncate text-[13px] font-medium text-heading">{j.title}</p>
                <p className="mt-0.5 truncate text-[12px] text-muted">
                  {j.department} · {j.location}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
