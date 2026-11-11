import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Briefcase, CheckCircle2, ClipboardList, Search, Sparkles, Trophy, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ai/StatusPill";
import { cn } from "@/lib/utils";
import type { Application, Job } from "@/types";

const JOURNEY_STEPS = [
  { label: "Applied", icon: CheckCircle2 },
  { label: "AI Screening", icon: Sparkles },
  { label: "Assessment", icon: ClipboardList },
  { label: "AI Interview", icon: Video },
  { label: "Shortlisted", icon: Trophy },
  { label: "Offer / Decision", icon: Briefcase },
];

export default function ApplicationSuccessPage() {
  const location = useLocation();
  const state = location.state as { application?: Application; job?: Job } | null;
  const application = state?.application;
  const job = state?.job;

  if (!application || !job) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="size-5" />}
        title="No recent application to show"
        description="View your applications to see status details."
        action={
          <Button size="sm" asChild>
            <Link to="/my-applications">View my applications</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-score-strong-bg text-score-strong">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="font-display text-h1 font-bold text-heading">Application submitted successfully</h1>
        <p className="max-w-md text-body-md text-muted">
          Your profile is now under review. Thanks for applying to {job.title} — our AI has already screened your resume and the hiring team will follow up soon.
        </p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <DetailRow label="Candidate name" value={application.personalInfo?.fullName ?? "—"} />
          <DetailRow label="Job applied for" value={job.title} />
          <DetailRow label="Application ID" value={application.id.toUpperCase()} />
          <DetailRow label="Submission date" value={format(new Date(application.appliedAt), "MMM d, yyyy")} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Current status</p>
            <div className="mt-1.5">
              <StatusPill stage={application.stage} />
            </div>
          </div>
          {application.matchScore !== undefined && <DetailRow label="AI Fit Score" value={String(application.matchScore)} />}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="p-6">
          <p className="mb-5 text-[13px] font-semibold text-heading">What happens next</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {JOURNEY_STEPS.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center gap-2 text-center">
                <div className={cn("flex size-10 items-center justify-center rounded-full", i === 0 ? "bg-primary text-white" : "bg-sunken text-muted")}>
                  <s.icon className="size-4.5" />
                </div>
                <p className={cn("text-[11.5px] font-medium leading-tight", i === 0 ? "text-heading" : "text-muted")}>{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button variant="outline" asChild>
          <Link to="/find-jobs">
            <Search className="size-4" /> Keep browsing
          </Link>
        </Button>
        <Button asChild>
          <Link to="/my-applications">View my applications</Link>
        </Button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted">{label}</p>
      <p className="mt-1 text-[14px] font-medium text-heading">{value}</p>
    </div>
  );
}
