import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, Download, ExternalLink, FileText, ScanSearch, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError } from "@/lib/api";
import { formatFileSize } from "@/lib/utils";
import * as resumeScreeningService from "@/services/resumeScreeningService";
import * as candidatesService from "@/services/candidatesService";
import { useToast } from "@/hooks/useToast";
import type { Candidate, ResumeFileMeta } from "@/types";

type ResumeState =
  | { status: "loading" }
  | { status: "ready"; meta: ResumeFileMeta }
  | { status: "not-stored" }
  | { status: "missing" }
  | { status: "error"; message: string };

/** Lets the recruiter attach a resume (e.g. one the candidate emailed) when none is stored. */
function AttachResumeButton({ candidate, onAttached }: { candidate: Candidate; onAttached: (c: Candidate) => void }) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(undefined);
    if (file.size > 4 * 1024 * 1024) {
      setError("File is too large. The maximum size is 4 MB.");
      return;
    }
    setBusy(true);
    try {
      const upload = await resumeScreeningService.uploadResume(file, () => {}, { jobId: candidate.appliedJobId });
      if (upload.stage !== "done" || !upload.resumeFileId) throw new Error(upload.errorMessage ?? "Upload failed. Please try again.");
      const updated = await candidatesService.attachResume(candidate.id, upload.resumeFileId);
      onAttached(updated);
      toast({ title: "Resume attached", description: `${file.name} was saved and screened against this candidate's job.`, variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="outline" loading={busy} onClick={() => inputRef.current?.click()}>
        <Upload className="size-3.5" /> Upload resume
      </Button>
      <p className="mt-1.5 text-[12px] text-muted">
        PDF or DOCX, up to 4 MB. The file is linked to this candidate and their application, and screened against their job. This replaces
        the current fit score.
      </p>
      {error && <p className="mt-1.5 text-[12px] text-error">{error}</p>}
    </div>
  );
}

/** The candidate's stored resume, with View and Download actions, or a clear note when no file exists. */
export function CandidateResumeCard({ candidate, onCandidateUpdated }: { candidate: Candidate; onCandidateUpdated?: (c: Candidate) => void }) {
  const [state, setState] = useState<ResumeState>(candidate.resumeFileId ? { status: "loading" } : { status: "not-stored" });

  useEffect(() => {
    if (!candidate.resumeFileId) {
      setState({ status: "not-stored" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    resumeScreeningService
      .getResumeFileMeta(candidate.resumeFileId)
      .then((meta) => !cancelled && setState({ status: "ready", meta }))
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setState({ status: "missing" });
        else setState({ status: "error", message: err instanceof Error ? err.message : "Couldn't load the resume." });
      });
    return () => {
      cancelled = true;
    };
  }, [candidate.resumeFileId]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted" />
          <CardTitle>Resume</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {state.status === "loading" && <Skeleton className="h-12" />}

        {state.status === "ready" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sunken text-muted">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-heading">{state.meta.fileName}</p>
                <p className="text-[12px] text-muted">
                  {state.meta.mimeType === "application/pdf" ? "PDF" : "DOCX"} · {formatFileSize(state.meta.sizeBytes)} · Uploaded{" "}
                  {format(new Date(state.meta.uploadedAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={resumeScreeningService.resumeFileUrl(state.meta.id)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" /> View resume
                </a>
              </Button>
              <Button size="sm" asChild>
                <a href={resumeScreeningService.resumeFileUrl(state.meta.id, true)}>
                  <Download className="size-3.5" /> Download
                </a>
              </Button>
            </div>
          </div>
        )}

        {(state.status === "not-stored" || state.status === "missing") && (
          <div className="flex gap-2.5 rounded-md border border-line bg-sunken/50 p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted" />
            <div className="space-y-1 text-[13px] text-ink">
              <p className="font-medium text-heading">Resume file not available</p>
              {state.status === "missing" ? (
                <p className="text-muted">The resume linked to this candidate could not be found in storage.</p>
              ) : candidate.resumeFileName ? (
                <p className="text-muted">
                  Only the file name <span className="font-medium text-ink">{candidate.resumeFileName}</span> was recorded. This application was
                  submitted before resume files were stored, so the file itself was never saved. Ask the candidate to send their resume, then
                  upload it here.
                </p>
              ) : (
                <p className="text-muted">No resume was submitted for this candidate.</p>
              )}
              {onCandidateUpdated && <AttachResumeButton candidate={candidate} onAttached={onCandidateUpdated} />}
            </div>
          </div>
        )}

        {state.status === "error" && <p className="text-[13px] text-error">{state.message}</p>}
      </CardContent>
    </Card>
  );
}

/** Results of screening the stored resume against the applied job's requirements. */
export function CandidateScreeningCard({ candidate }: { candidate: Candidate }) {
  const screening = candidate.screening;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ScanSearch className="size-4 text-accent" />
          <CardTitle>Resume screening</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {!screening ? (
          <p className="text-[13px] text-muted">
            No resume screening on file. This candidate's fit score was not computed from a stored resume, so it can't be traced to resume
            content.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[13px] text-ink">
                Screened against <span className="font-medium text-heading">{screening.jobTitle}</span> on{" "}
                {format(new Date(screening.screenedAt), "MMM d, yyyy")}
              </p>
              <p className="text-[13px] text-muted">
                <span className="font-mono text-[15px] font-bold text-heading">{screening.matchScore}%</span> match ·{" "}
                {screening.matchedSkills.length} of {screening.requirements.length} requirements found
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Found in resume</p>
              <div className="flex flex-wrap gap-1.5">
                {screening.matchedSkills.length > 0 ? (
                  screening.matchedSkills.map((s) => (
                    <Badge key={s} variant="success">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[13px] text-muted">None of the job's requirements were found.</span>
                )}
              </div>
            </div>

            {screening.missingSkills.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">Not found in resume</p>
                <div className="flex flex-wrap gap-1.5">
                  {screening.missingSkills.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 border-t border-line pt-3 text-[13px] sm:grid-cols-2">
              <div>
                <p className="text-[12px] text-muted">Education (from resume)</p>
                <p className="text-ink">{screening.extractedEducation}</p>
              </div>
              <div>
                <p className="text-[12px] text-muted">Experience (from resume)</p>
                <p className="text-ink">
                  {screening.extractedExperienceYears > 0 ? `${screening.extractedExperienceYears} yrs` : "No dated work experience found"}
                </p>
              </div>
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted">{screening.narrative}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
