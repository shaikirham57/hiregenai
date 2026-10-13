import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  RotateCcw,
  ScanSearch,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeadCell, TableRow } from "@/components/ui/Table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { KpiTile } from "@/components/charts/KpiTile";
import * as resumeScreeningService from "@/services/resumeScreeningService";
import * as jobsService from "@/services/jobsService";
import { useToast } from "@/hooks/useToast";
import { cn, formatFileSize } from "@/lib/utils";
import { colorForSeed } from "@/lib/constants";
import type { Job, ResumeUploadJob } from "@/types";

const PROCESSING_STAGE_LABEL: Record<ResumeUploadJob["stage"], string> = {
  uploading: "Uploading...",
  extracting: "Extracting resume text...",
  vectorizing: "Matching against role...",
  done: "Completed",
  error: "Failed",
};

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_FILE_MB = 10;
const MAX_BATCH = 25;

type BatchStatus = "queued" | "processing" | "completed" | "failed";

interface BatchItem {
  id: string;
  fileName: string;
  fileSize: number;
  status: BatchStatus;
  stageLabel: string;
  progress: number;
  errorMessage?: string;
  jobId?: string;
  candidateName?: string;
  extractedSkills?: string[];
  extractedExperienceYears?: number;
  extractedEducation?: string;
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}

const STATUS_BADGE_VARIANT: Record<BatchStatus, "neutral" | "primary" | "success" | "error"> = {
  queued: "neutral",
  processing: "primary",
  completed: "success",
  failed: "error",
};

const STATUS_LABEL: Record<BatchStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

type Recommendation = "strong" | "good" | "none";

function getRecommendation(score: number): Recommendation {
  if (score >= 80) return "strong";
  if (score >= 55) return "good";
  return "none";
}

const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  strong: "Strong Match",
  good: "Good Match",
  none: "Not a Match",
};

const RECOMMENDATION_BADGE: Record<Recommendation, "success" | "warning" | "error"> = {
  strong: "success",
  good: "warning",
  none: "error",
};

const RECOMMENDATION_BAR: Record<Recommendation, string> = {
  strong: "bg-score-strong",
  good: "bg-score-review",
  none: "bg-score-weak",
};

type ExperienceBucket = "junior" | "mid" | "senior" | "lead";

function getExperienceBucket(years: number): ExperienceBucket {
  if (years <= 2) return "junior";
  if (years <= 5) return "mid";
  if (years <= 8) return "senior";
  return "lead";
}

type Decision = "shortlisted" | "rejected";

type SortOption = "scoreDesc" | "scoreAsc" | "expDesc" | "expAsc" | "skillsDesc" | "nameAsc";

const SORT_LABEL: Record<SortOption, string> = {
  scoreDesc: "Match score (high to low)",
  scoreAsc: "Match score (low to high)",
  expDesc: "Experience (high to low)",
  expAsc: "Experience (low to high)",
  skillsDesc: "Most skills matched",
  nameAsc: "Candidate name (A–Z)",
};

function guessCandidateName(fileName: string): string {
  const base = fileName.replace(/\.[^./]+$/, "");
  const cleaned = base
    .replace(/[_\-.]+/g, " ")
    .replace(/\b(resume|cv)\b/gi, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Unknown Candidate";
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function downloadCsv(rows: BatchItem[], jobTitleFor: (jobId?: string) => string, decisions: Record<string, Decision>) {
  const headers = [
    "Candidate",
    "Resume File",
    "Role",
    "Match Score",
    "Recommendation",
    "Experience (yrs)",
    "Education",
    "Skills Matched",
    "Missing Skills",
    "Status",
  ];
  const lines = [headers.join(",")];
  rows.forEach((r) => {
    const recommendation = RECOMMENDATION_LABEL[getRecommendation(r.matchScore ?? 0)];
    const status = decisions[r.id] === "shortlisted" ? "Shortlisted" : decisions[r.id] === "rejected" ? "Rejected" : "Completed";
    const values = [
      r.candidateName ?? "",
      r.fileName,
      jobTitleFor(r.jobId),
      String(r.matchScore ?? ""),
      recommendation,
      String(r.extractedExperienceYears ?? ""),
      r.extractedEducation ?? "",
      (r.matchedSkills ?? []).join("; "),
      (r.missingSkills ?? []).join("; "),
      status,
    ];
    lines.push(values.map((v) => `"${v.replace(/"/g, '""')}"`).join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-screening-results-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "error" }) {
  const toneClass =
    tone === "success" ? "text-score-strong" : tone === "warning" ? "text-score-review" : tone === "error" ? "text-score-weak" : "text-heading";
  return (
    <div className="rounded-lg bg-sunken px-4 py-3.5">
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p className={cn("mt-1 font-display text-h2 font-bold", toneClass)}>{value}</p>
    </div>
  );
}

export default function ScreeningPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsStatus, setJobsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedJobId, setSelectedJobId] = useState("");
  // The File objects for queued resumes, keyed by batch item id, so their real content can be screened.
  const filesRef = useRef(new Map<string, File>());
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isScreening, setIsScreening] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string>();
  const [runTotal, setRunTotal] = useState(0);
  const [runIds, setRunIds] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [recommendationFilter, setRecommendationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("scoreDesc");

  const loadJobs = useCallback(async () => {
    setJobsStatus("loading");
    try {
      const data = await jobsService.getJobs();
      // Closed roles aren't hiring, so they aren't offered for screening.
      const screenable = data.filter((j) => j.status !== "closed");
      setJobs(screenable);
      setSelectedJobId((current) => (screenable.some((j) => j.id === current) ? current : (screenable[0]?.id ?? "")));
      setJobsStatus("ready");
    } catch {
      setJobsStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const jobTitleFor = (jobId?: string) => jobs.find((j) => j.id === jobId)?.title ?? "—";
  const hasJobs = jobsStatus === "ready" && jobs.length > 0;

  const validateFile = (file: File): string | undefined => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) return `${file.name}: unsupported file type. Upload a PDF or DOCX resume.`;
    if (file.size > MAX_FILE_MB * 1024 * 1024) return `${file.name}: file exceeds the ${MAX_FILE_MB}MB limit.`;
    return undefined;
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList);
    const room = MAX_BATCH - batch.length;
    if (room <= 0) {
      setFileError(`Batch limit reached — you can screen up to ${MAX_BATCH} resumes at a time. Remove some before adding more.`);
      return;
    }

    const toAdd = incoming.slice(0, room);
    const accepted: BatchItem[] = [];
    let firstError: string | undefined;

    toAdd.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        firstError = firstError ?? validationError;
        return;
      }
      const itemId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      filesRef.current.set(itemId, file);
      accepted.push({
        id: itemId,
        fileName: file.name,
        fileSize: file.size,
        status: "queued",
        stageLabel: "Queued",
        progress: 0,
        candidateName: guessCandidateName(file.name),
      });
    });

    if (incoming.length > room) {
      firstError = firstError ?? `Only ${room} more resume${room === 1 ? "" : "s"} can be added right now (batch limit is ${MAX_BATCH}).`;
    }

    setFileError(firstError);
    if (accepted.length > 0) setBatch((prev) => [...prev, ...accepted]);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removeItem = (id: string) => {
    filesRef.current.delete(id);
    setBatch((prev) => prev.filter((b) => b.id !== id));
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDecisions((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const removeSelected = () => {
    selectedIds.forEach((id) => filesRef.current.delete(id));
    setBatch((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = batch.length > 0 && selectedIds.size === batch.length;
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(batch.map((b) => b.id)));
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyUpdate = (id: string, jobId: string, update: resumeScreeningService.ScreenedResume) => {
    setBatch((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (update.stage === "error") {
          return { ...b, status: "failed", progress: update.progress, stageLabel: "Failed", errorMessage: update.errorMessage, jobId };
        }
        if (update.stage === "done") {
          // Matched and missing skills are computed by the API against the job's real requirements.
          const matchedSkills = update.matchedSkills ?? [];
          const missingSkills = update.missingSkills ?? [];
          return {
            ...b,
            status: "completed",
            progress: 100,
            stageLabel: "Completed",
            errorMessage: undefined,
            jobId,
            candidateName: update.candidateName ?? b.candidateName,
            extractedSkills: update.extractedSkills,
            extractedExperienceYears: update.extractedExperienceYears,
            extractedEducation: update.extractedEducation,
            matchScore: update.matchScore,
            matchedSkills,
            missingSkills,
          };
        }
        return { ...b, status: "processing", progress: update.progress, stageLabel: PROCESSING_STAGE_LABEL[update.stage], jobId };
      })
    );
  };

  const runItem = async (item: BatchItem, jobId: string) => {
    const file = filesRef.current.get(item.id);
    if (!file) {
      applyUpdate(item.id, jobId, {
        id: item.id,
        fileName: item.fileName,
        stage: "error",
        progress: 0,
        errorMessage: "File is no longer available. Remove it and upload it again.",
      });
      return;
    }
    await resumeScreeningService.screenResumeFile(file, jobId, (update) => applyUpdate(item.id, jobId, update));
  };

  const screenAll = async () => {
    const queued = batch.filter((b) => b.status === "queued");
    if (queued.length === 0 || isScreening || !selectedJobId) return;

    const jobId = selectedJobId;
    setActiveJobId(jobId);
    setRunTotal(queued.length);
    setRunIds(new Set(queued.map((b) => b.id)));
    setIsScreening(true);

    const queue = [...queued];
    const concurrency = Math.min(4, queue.length);
    const workers = Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) return;
        await runItem(next, jobId);
      }
    });
    await Promise.all(workers);

    setIsScreening(false);
    toast({
      title: "Batch screening complete",
      description: `${queued.length} resume${queued.length === 1 ? "" : "s"} screened against ${jobTitleFor(jobId)}.`,
      variant: "success",
    });
  };

  const retryItem = async (id: string) => {
    const item = batch.find((b) => b.id === id);
    if (!item) return;
    const jobId = item.jobId ?? activeJobId ?? selectedJobId;
    setBatch((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "processing", stageLabel: "Retrying...", progress: 0, errorMessage: undefined } : b))
    );
    await runItem(item, jobId);
  };

  const setDecision = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    toast({
      title: decision === "shortlisted" ? "Candidate shortlisted" : "Candidate rejected",
      variant: decision === "shortlisted" ? "success" : "default",
    });
  };

  const previewResume = (fileName: string) => {
    toast({ title: "Preview unavailable", description: `Resume preview for ${fileName} isn't wired up in this demo.` });
  };

  const totalCount = batch.length;
  const completedItems = useMemo(() => batch.filter((b) => b.status === "completed"), [batch]);
  const processingCount = batch.filter((b) => b.status === "processing").length;
  const queuedCount = batch.filter((b) => b.status === "queued").length;
  const failedCount = batch.filter((b) => b.status === "failed").length;
  const runScreenedCount = batch.filter((b) => runIds.has(b.id) && (b.status === "completed" || b.status === "failed")).length;

  const strongCount = completedItems.filter((b) => getRecommendation(b.matchScore ?? 0) === "strong").length;
  const goodCount = completedItems.filter((b) => getRecommendation(b.matchScore ?? 0) === "good").length;
  const noMatchCount = completedItems.filter((b) => getRecommendation(b.matchScore ?? 0) === "none").length;

  const availableSkills = useMemo(
    () => Array.from(new Set(completedItems.flatMap((j) => j.extractedSkills ?? []))).sort(),
    [completedItems]
  );

  const filteredCandidates = useMemo(() => {
    const rows = completedItems.filter((job) => {
      const decision = decisions[job.id];
      const status = decision ?? "completed";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (recommendationFilter !== "all" && getRecommendation(job.matchScore ?? 0) !== recommendationFilter) return false;
      if (expFilter !== "all" && getExperienceBucket(job.extractedExperienceYears ?? 0) !== expFilter) return false;
      if (skillFilter !== "all" && !(job.extractedSkills ?? []).includes(skillFilter)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${job.candidateName ?? ""} ${job.fileName} ${(job.extractedSkills ?? []).join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...rows];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "scoreAsc":
          return (a.matchScore ?? 0) - (b.matchScore ?? 0);
        case "expDesc":
          return (b.extractedExperienceYears ?? 0) - (a.extractedExperienceYears ?? 0);
        case "expAsc":
          return (a.extractedExperienceYears ?? 0) - (b.extractedExperienceYears ?? 0);
        case "skillsDesc":
          return (b.matchedSkills?.length ?? 0) - (a.matchedSkills?.length ?? 0);
        case "nameAsc":
          return (a.candidateName ?? "").localeCompare(b.candidateName ?? "");
        case "scoreDesc":
        default:
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      }
    });
    return sorted;
  }, [completedItems, decisions, statusFilter, recommendationFilter, expFilter, skillFilter, search, sortBy]);

  const avgScore = completedItems.length
    ? Math.round(completedItems.reduce((sum, j) => sum + (j.matchScore ?? 0), 0) / completedItems.length)
    : 0;

  const topSkill = useMemo(() => {
    const counts = new Map<string, number>();
    completedItems.forEach((j) => (j.matchedSkills ?? []).forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)));
    let best: string | null = null;
    let bestCount = 0;
    counts.forEach((count, skill) => {
      if (count > bestCount) {
        best = skill;
        bestCount = count;
      }
    });
    return best;
  }, [completedItems]);

  const selectedJobTitle = jobTitleFor(selectedJobId);

  const handleDownload = () => {
    if (completedItems.length === 0) {
      toast({ title: "Nothing to export", description: "Screen at least one resume before downloading results." });
      return;
    }
    downloadCsv(completedItems, jobTitleFor, decisions);
  };

  return (
    <div>
      <PageHeader title="AI Resume Screening" description="Upload resumes in bulk and let AI analyze skills, experience, and job fit." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Resumes Uploaded" value={String(totalCount)} icon={UploadCloud} />
        <KpiTile label="Processed" value={String(completedItems.length)} icon={CheckCircle2} />
        <KpiTile label="In progress" value={String(processingCount)} icon={Loader2} />
        <KpiTile label="Strong Matches" value={String(strongCount)} icon={Sparkles} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Upload Resumes</CardTitle>
              <CardDescription>Choose a job, add up to {MAX_BATCH} resumes, then screen them with AI.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-primary">Step 1 — Choose a job</p>
            <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={isScreening || !hasJobs}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue
                  placeholder={jobsStatus === "loading" ? "Loading jobs..." : jobsStatus === "error" ? "Couldn't load jobs" : "No jobs yet"}
                />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.title}
                    {opt.status !== "open" ? ` (${opt.status[0].toUpperCase()}${opt.status.slice(1)})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2">
              {jobsStatus === "loading" ? (
                <Badge variant="neutral">
                  <Loader2 className="size-3 animate-spin" /> Loading your jobs...
                </Badge>
              ) : jobsStatus === "error" ? (
                <p className="text-[12.5px] text-error">
                  Couldn't load your jobs.{" "}
                  <button type="button" className="font-semibold text-primary hover:underline" onClick={() => void loadJobs()}>
                    Try again
                  </button>
                </p>
              ) : !hasJobs ? (
                <p className="text-[12.5px] text-muted">
                  You haven't created any jobs yet. Resumes are screened against a job's skills and description, so{" "}
                  <Link to="/jobs/new" className="font-semibold text-primary hover:underline">
                    create a job in Job Management
                  </Link>{" "}
                  first.
                </p>
              ) : isScreening ? (
                <Badge variant="neutral">Role locked for this batch: {jobTitleFor(activeJobId)}</Badge>
              ) : (
                <Badge variant="primary">Screening for: {selectedJobTitle}</Badge>
              )}
            </div>

            <p className="mb-1.5 mt-5 text-[11px] font-semibold uppercase tracking-eyebrow text-primary">Step 2 — Upload resumes</p>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-6 py-5 text-center transition-colors",
                dragActive ? "border-accent bg-accent/5" : "border-line-strong hover:border-primary/50 hover:bg-sunken/50"
              )}
            >
              <input type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={handleInputChange} />
              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-brand-soft text-primary">
                <UploadCloud className="size-4" />
              </div>
              <p className="text-[13.5px] font-semibold text-heading">
                Drag &amp; drop resumes here, or <span className="text-primary">Browse files</span>
              </p>
              <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1.5">
                <Badge variant="outline">PDF</Badge>
                <Badge variant="outline">DOCX</Badge>
                <Badge variant="neutral">Max 10MB per file</Badge>
                <Badge variant="neutral">Up to {MAX_BATCH} resumes</Badge>
              </div>
            </label>
            {fileError && <p className="mt-2 text-[12px] text-error">{fileError}</p>}

            {batch.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-eyebrow text-primary">Step 3 — Screen resumes with AI</p>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected ? true : selectedIds.size > 0 ? "indeterminate" : false}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all resumes"
                    />
                    <span className="text-[12.5px] text-muted">
                      {selectedIds.size > 0
                        ? `${selectedIds.size} selected`
                        : `${batch.length} resume${batch.length === 1 ? "" : "s"} in this batch`}
                    </span>
                  </div>
                  {selectedIds.size > 0 && (
                    <Button variant="outline" size="sm" onClick={removeSelected}>
                      <Trash2 className="size-3.5" /> Remove Selected
                    </Button>
                  )}
                </div>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeadCell className="w-9" />
                        <TableHeadCell>Candidate Name</TableHeadCell>
                        <TableHeadCell>Resume File</TableHeadCell>
                        <TableHeadCell>Role</TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                        <TableHeadCell>Match Score</TableHeadCell>
                        <TableHeadCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batch.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={() => toggleSelect(item.id)}
                              aria-label={`Select ${item.fileName}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={item.candidateName ?? item.fileName} color={colorForSeed(item.candidateName ?? item.fileName)} size="sm" />
                              <p className="max-w-[140px] truncate text-[13px] font-medium text-heading">{item.candidateName}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="size-3.5 shrink-0 text-muted" />
                              <div className="min-w-0">
                                <p className="max-w-[140px] truncate text-[13px] text-ink">{item.fileName}</p>
                                <p className="text-[11px] text-muted">{formatFileSize(item.fileSize)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="max-w-[140px] truncate text-[13px] text-ink">{item.jobId ? jobTitleFor(item.jobId) : selectedJobTitle}</p>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant={STATUS_BADGE_VARIANT[item.status]}>
                                {item.status === "processing" && <Loader2 className="size-3 animate-spin" />}
                                {STATUS_LABEL[item.status]}
                              </Badge>
                              {item.status === "processing" && <Progress value={item.progress} className="mt-1.5 h-1" />}
                              {item.status === "failed" && item.errorMessage && (
                                <p className="mt-1 max-w-[160px] text-[11px] text-error">{item.errorMessage}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.status === "completed" ? (
                              <span className="font-mono text-[13.5px] font-bold text-heading">{item.matchScore}%</span>
                            ) : (
                              <span className="text-[13px] text-muted">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Resume actions">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => previewResume(item.fileName)}>
                                  <Eye className="size-3.5" /> Preview
                                </DropdownMenuItem>
                                {item.status === "failed" && (
                                  <DropdownMenuItem onSelect={() => retryItem(item.id)}>
                                    <RotateCcw className="size-3.5" /> Retry
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => removeItem(item.id)} className="text-error">
                                  <Trash2 className="size-3.5" /> Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="flex items-center gap-1.5 text-[13px] text-muted">
                    {isScreening && <Loader2 className="size-3.5 animate-spin text-primary" />}
                    {isScreening
                      ? `Screening ${runScreenedCount} of ${runTotal} resumes...`
                      : queuedCount > 0
                        ? `${queuedCount} resume${queuedCount === 1 ? "" : "s"} ready to screen`
                        : failedCount > 0
                          ? `${failedCount} resume${failedCount === 1 ? "" : "s"} failed — retry from the row menu`
                          : "All resumes in this batch have been screened"}
                  </p>
                  <Button onClick={screenAll} disabled={queuedCount === 0 || isScreening || !selectedJobId} loading={isScreening} variant="gradient">
                    <Sparkles className="size-4" />
                    Screen Resumes with AI{queuedCount > 0 && !isScreening ? ` (${queuedCount})` : ""}
                  </Button>
                </div>
                {isScreening && <Progress value={runTotal ? (runScreenedCount / runTotal) * 100 : 0} className="mt-2" />}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" /> AI Screening Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {completedItems.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                <Sparkles className="size-5 text-muted" />
                <p className="text-[13px] font-medium text-heading">No screening results yet</p>
                <p className="text-[12px] text-muted">Insights will appear here once resumes finish screening.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md bg-score-strong-bg px-3 py-2.5">
                  <span className="text-[13px] font-medium text-ink">Strong matches</span>
                  <span className="font-display text-h3 font-bold text-score-strong">{strongCount}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted">Candidates screened</span>
                  <span className="font-semibold text-heading">{completedItems.length}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted">Average match score</span>
                  <span className="font-semibold text-heading">{avgScore}%</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted">Top matched skill</span>
                  <span className="font-semibold text-heading">{topSkill ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-muted">Evaluating for</span>
                  <span className="max-w-[150px] truncate font-semibold text-heading">{selectedJobTitle}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {totalCount > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div>
              <CardTitle>Batch Screening Summary</CardTitle>
              <CardDescription>Overview of this screening batch against {selectedJobTitle}.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <SummaryStat label="Total Resumes" value={totalCount} />
              <SummaryStat label="Screened" value={completedItems.length + failedCount} />
              <SummaryStat label="Strong Matches" value={strongCount} tone="success" />
              <SummaryStat label="Good Matches" value={goodCount} tone="warning" />
              <SummaryStat label="Not a Match" value={noMatchCount} tone="error" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Screening Results</CardTitle>
            <CardDescription>
              {completedItems.length} candidate{completedItems.length === 1 ? "" : "s"} screened so far
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={completedItems.length === 0}>
            <Download className="size-3.5" /> Download Results
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates or skills..." className="pl-9" />
            </div>
            <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Recommendation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All recommendations</SelectItem>
                <SelectItem value="strong">Strong Match</SelectItem>
                <SelectItem value="good">Good Match</SelectItem>
                <SelectItem value="none">Not a Match</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={expFilter} onValueChange={setExpFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All experience</SelectItem>
                <SelectItem value="junior">0–2 yrs</SelectItem>
                <SelectItem value="mid">3–5 yrs</SelectItem>
                <SelectItem value="senior">6–8 yrs</SelectItem>
                <SelectItem value="lead">9+ yrs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                {availableSkills.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABEL) as SortOption[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {totalCount === 0 ? (
            <EmptyState
              icon={<ScanSearch className="size-5" />}
              title="No resumes uploaded yet"
              description="Upload resumes above and click Screen All Resumes to see AI-powered results here."
            />
          ) : completedItems.length === 0 ? (
            <EmptyState
              icon={isScreening ? <Loader2 className="size-5 animate-spin" /> : <Users className="size-5" />}
              title={isScreening ? "Screening in progress" : "No resumes screened yet"}
              description={
                isScreening
                  ? "Candidates will appear here as soon as AI finishes analyzing their resumes."
                  : "Click Screen All Resumes above to run this batch through AI screening."
              }
            />
          ) : filteredCandidates.length === 0 ? (
            <EmptyState icon={<Users className="size-5" />} title="No matching candidates" description="Try adjusting your search or filters." />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell className="w-9" />
                    <TableHeadCell>Candidate Name</TableHeadCell>
                    <TableHeadCell>Resume</TableHeadCell>
                    <TableHeadCell>Match Score</TableHeadCell>
                    <TableHeadCell>Skills</TableHeadCell>
                    <TableHeadCell>Experience</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCandidates.map((job) => {
                    const score = job.matchScore ?? 0;
                    const recommendation = getRecommendation(score);
                    const decision = decisions[job.id];
                    const statusMeta =
                      decision === "shortlisted"
                        ? { label: "Shortlisted", variant: "success" as const }
                        : decision === "rejected"
                          ? { label: "Rejected", variant: "error" as const }
                          : { label: "Completed", variant: "primary" as const };
                    const isExpanded = expandedIds.has(job.id);

                    return (
                      <Fragment key={job.id}>
                        <TableRow>
                          <TableCell>
                            <button
                              onClick={() => toggleExpand(job.id)}
                              className="flex size-6 items-center justify-center rounded-sm text-muted transition-colors hover:bg-sunken hover:text-ink"
                              aria-label={isExpanded ? "Collapse details" : "Expand details"}
                            >
                              <ChevronDown className={cn("size-4 transition-transform", isExpanded && "rotate-180")} />
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar name={job.candidateName ?? job.fileName} color={colorForSeed(job.candidateName ?? job.fileName)} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-heading">{job.candidateName}</p>
                                <p className="truncate text-[12px] text-muted">Applying for {jobTitleFor(job.jobId)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sunken text-muted">
                                <FileText className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="max-w-[160px] truncate text-[13px] text-ink">{job.fileName}</p>
                                <p className="text-[11px] text-muted">{formatFileSize(job.fileSize)}</p>
                              </div>
                              <button
                                onClick={() => previewResume(job.fileName)}
                                className="ml-1 shrink-0 text-muted transition-colors hover:text-primary"
                                title="Preview resume"
                                aria-label="Preview resume"
                              >
                                <Eye className="size-4" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16">
                                <div className="flex items-baseline gap-0.5">
                                  <span className="font-mono text-[15px] font-bold text-heading">{score}</span>
                                  <span className="text-[11px] text-muted">%</span>
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-sunken">
                                  <div className={cn("h-full rounded-pill", RECOMMENDATION_BAR[recommendation])} style={{ width: `${score}%` }} />
                                </div>
                              </div>
                              <Badge variant={RECOMMENDATION_BADGE[recommendation]}>{RECOMMENDATION_LABEL[recommendation]}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="primary">{job.matchedSkills?.length ?? 0} matched</Badge>
                              <Badge variant="outline">{job.missingSkills?.length ?? 0} missing</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-[13px] font-medium text-ink">{job.extractedExperienceYears} yrs</p>
                            <p className="text-[12px] text-muted">{job.extractedEducation}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Candidate actions">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => previewResume(job.fileName)}>
                                  <Eye className="size-3.5" /> View resume
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setDecision(job.id, "shortlisted")}>
                                  <ThumbsUp className="size-3.5" /> Shortlist
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setDecision(job.id, "rejected")}>
                                  <ThumbsDown className="size-3.5" /> Reject
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => removeItem(job.id)} className="text-error">
                                  <Trash2 className="size-3.5" /> Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={8} className="bg-sunken/50 py-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">Skills Matched</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(job.matchedSkills ?? []).length > 0 ? (
                                      job.matchedSkills!.map((skill) => (
                                        <Badge key={skill} variant="primary">
                                          {skill}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-[12.5px] text-muted">No required skills matched.</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted">Missing Skills</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(job.missingSkills ?? []).length > 0 ? (
                                      job.missingSkills!.map((skill) => (
                                        <Badge key={skill} variant="outline">
                                          {skill}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-[12.5px] text-muted">No missing skills for this role.</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
