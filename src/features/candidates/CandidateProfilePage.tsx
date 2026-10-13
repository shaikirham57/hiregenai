import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Award, Ban, Briefcase, CalendarClock, GraduationCap, Info, Mail, MapPin, ShieldAlert, Sparkles, ThumbsUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { ScoreGauge } from "@/components/ai/ScoreGauge";
import { FitScoreBar } from "@/components/ai/FitScoreBar";
import { RiskBadge } from "@/components/ai/RiskBadge";
import { StatusPill } from "@/components/ai/StatusPill";
import { XaiDrawer } from "@/components/ai/XaiDrawer";
import { CandidateResumeCard, CandidateScreeningCard } from "./CandidateResumeCards";
import * as candidatesService from "@/services/candidatesService";
import * as jobsService from "@/services/jobsService";
import * as interviewsService from "@/services/interviewsService";
import { useToast } from "@/hooks/useToast";
import { PIPELINE_STAGE_LABELS, type Candidate, type Interview, type InterviewStatus, type Job, type PipelineStage } from "@/types";

const INTERVIEW_STATUS_LABEL: Record<InterviewStatus, string> = {
  scheduled: "Upcoming",
  completed: "Completed",
  canceled: "Canceled",
};

const INTERVIEW_STATUS_VARIANT: Record<InterviewStatus, "primary" | "success" | "neutral"> = {
  scheduled: "primary",
  completed: "success",
  canceled: "neutral",
};

export default function CandidateProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | undefined>();
  const [job, setJob] = useState<Job | undefined>();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [xaiOpen, setXaiOpen] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    candidatesService.getCandidateById(id).then(async (c) => {
      setCandidate(c);
      if (c) {
        const [j, ints] = await Promise.all([jobsService.getJobById(c.appliedJobId), interviewsService.getInterviewsByCandidateId(c.id)]);
        setJob(j);
        setInterviews(ints);
      }
      setLoading(false);
    });
  }, [id]);

  const changeStage = async (toStage: PipelineStage) => {
    if (!candidate || candidate.stage === toStage) return;
    setUpdatingStage(true);
    const updated = await candidatesService.updateCandidateStage(candidate.id, toStage);
    if (updated) {
      setCandidate(updated);
      toast({ title: "Stage updated", description: `${updated.name} moved to ${PIPELINE_STAGE_LABELS[toStage]}.`, variant: "success" });
    }
    setUpdatingStage(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <EmptyState
        title="Candidate not found"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/candidates">Back to candidates</Link>
          </Button>
        }
      />
    );
  }

  const { fitScore, authenticity } = candidate;
  const matchedSkillSet = new Set(fitScore.matchedSkills);
  const matchedCandidateSkills = candidate.skills.filter((s) => matchedSkillSet.has(s));
  const additionalCandidateSkills = candidate.skills.filter((s) => !matchedSkillSet.has(s));

  return (
    <div>
      <Link to="/candidates" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Back to candidates
      </Link>

      <PageHeader
        title={candidate.name}
        description={job ? `Applied for ${job.title}` : undefined}
        actions={
          <Button onClick={() => setXaiOpen(true)}>
            <Sparkles className="size-4" /> Why this score?
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface p-3">
        <span className="mr-1 text-[12px] font-medium text-muted">Recruiter actions:</span>
        {candidate.stage === "rejected" ? (
          <p className="text-[13px] text-muted">This candidate was rejected for this role.</p>
        ) : (
          <>
            {candidate.stage === "applied" && (
              <Button size="sm" variant="outline" loading={updatingStage} onClick={() => changeStage("screened")}>
                <ThumbsUp className="size-3.5" /> Shortlist
              </Button>
            )}
            {(candidate.stage === "applied" || candidate.stage === "screened") && (
              <Button size="sm" variant="outline" loading={updatingStage} onClick={() => changeStage("interview")}>
                <CalendarClock className="size-3.5" /> Schedule Interview
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setRejectConfirmOpen(true)}>
              <Ban className="size-3.5" /> Reject
            </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-6 p-5">
              <Avatar name={candidate.name} color={candidate.avatarColor} size="lg" />
              <div className="flex-1 space-y-1.5">
                <p className="flex items-center gap-1.5 text-[13px] text-muted">
                  <Mail className="size-3.5" /> {candidate.email}
                </p>
                <p className="flex items-center gap-1.5 text-[13px] text-muted">
                  <MapPin className="size-3.5" /> {candidate.location}
                </p>
                <p className="flex items-center gap-1.5 text-[13px] text-muted">
                  <GraduationCap className="size-3.5" /> {candidate.education}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill stage={candidate.stage} />
                <RiskBadge level={candidate.riskLevel} />
              </div>
            </CardContent>
          </Card>

          <CandidateResumeCard candidate={candidate} />
          <CandidateScreeningCard candidate={candidate} />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-muted" />
                <CardTitle>Employment history</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="space-y-4">
                {candidate.employmentHistory.map((entry, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-[13px] font-medium text-heading">
                        {entry.title} · {entry.company}
                      </p>
                      <p className="text-[12px] text-muted">
                        {entry.startDate} — {entry.endDate ?? "Present"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              {candidate.certifications.length > 0 && (
                <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                  <Award className="size-4 text-muted" />
                  <span className="text-[13px] text-ink">{candidate.certifications.join(", ")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                <CardTitle>AI summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ul className="space-y-2">
                {candidate.summaryBullets.map((bullet, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {interviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Interviews</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="divide-y divide-line">
                  {interviews.map((interview) => (
                    <li key={interview.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-[13px] font-medium text-heading">{format(new Date(interview.scheduledAt), "MMM d, yyyy 'at' h:mm a")}</p>
                        <p className="text-[12px] text-muted">with {interview.interviewer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={INTERVIEW_STATUS_VARIANT[interview.status]}>{INTERVIEW_STATUS_LABEL[interview.status]}</Badge>
                        {interview.status === "completed" && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/interviews/${interview.id}/results`}>View results</Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-1.5">
                <CardTitle>AI Fit Score</CardTitle>
                <Tooltip
                  content={
                    <span>
                      70–100 = Strong match
                      <br />
                      40–69 = Needs review
                      <br />
                      Below 40 = Weak match
                    </span>
                  }
                >
                  <Info className="size-3.5 cursor-help text-muted" />
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pt-2">
              <ScoreGauge score={fitScore.overall} label="Overall" size={120} strokeWidth={11} />
              <div className="w-full space-y-2.5">
                <FitScoreBar label="Skills" value={fitScore.skills} />
                <FitScoreBar label="Experience" value={fitScore.experience} />
                <FitScoreBar label="Education" value={fitScore.education} />
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setXaiOpen(true)}>
                View full explanation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-muted" />
                <CardTitle>Authenticity &amp; risk</CardTitle>
                <Tooltip content="Reflects how consistent this candidate's resume and profile signals are with typical, verifiable patterns. Higher scores mean fewer inconsistencies were detected during automated review.">
                  <Info className="size-3.5 cursor-help text-muted" />
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted">Authenticity score</span>
                <span className="font-mono font-semibold text-heading">{authenticity.score}</span>
              </div>
              <Badge variant={authenticity.status === "authentic" ? "success" : authenticity.status === "suspicious" ? "warning" : "error"} className="capitalize">
                {authenticity.status.replace("_", " ")}
              </Badge>
              {candidate.riskFlags.length > 0 ? (
                <ul className="space-y-2 border-t border-line pt-3">
                  {candidate.riskFlags.map((flag, i) => (
                    <li key={i} className="text-[12.5px] text-ink">
                      <span className="font-medium capitalize">{flag.type.replace("-", " ")}:</span> {flag.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-line pt-3 text-[12.5px] text-muted">No risk flags detected.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Matched to role</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchedCandidateSkills.length > 0 ? (
                    matchedCandidateSkills.map((skill) => (
                      <Badge key={skill} variant="primary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[12.5px] text-muted">No direct skill matches found.</span>
                  )}
                </div>
              </div>
              {additionalCandidateSkills.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Additional skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {additionalCandidateSkills.map((skill) => (
                      <Badge key={skill} variant="neutral">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <XaiDrawer candidate={candidate} open={xaiOpen} onOpenChange={setXaiOpen} />

      <Modal open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <ModalContent title="Reject this candidate?" description={`${candidate.name} will be marked as rejected for this role.`}>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={updatingStage}
              onClick={() => {
                changeStage("rejected");
                setRejectConfirmOpen(false);
              }}
            >
              Reject candidate
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
