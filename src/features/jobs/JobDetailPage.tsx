import { useEffect, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Plus, Sparkles, Users, Wand2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Slider } from "@/components/ui/Slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AiGeneratedTag } from "@/components/ai/AiGeneratedTag";
import { RegenerateButton } from "@/components/ai/RegenerateButton";
import { ScoreBadge } from "@/components/ai/ScoreBadge";
import { AddCandidateDrawer } from "@/features/jobs/AddCandidateDrawer";
import * as jobsService from "@/services/jobsService";
import * as candidatesService from "@/services/candidatesService";
import * as aiContentService from "@/services/aiContentService";
import { detectBiasFlags, applyBiasFix, type BiasFlag } from "@/lib/biasFlags";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import type { Candidate, Job, JobStatus } from "@/types";

const DESCRIPTION_MAX_LENGTH = 2000;

const STATUS_BADGE_CLASSES: Record<JobStatus, string> = {
  open: "border-transparent bg-score-strong-bg text-score-strong",
  paused: "border-transparent bg-score-review-bg text-score-review",
  draft: "border-line-strong bg-surface text-ink",
  closed: "border-transparent bg-sunken text-ink",
};

const STATUS_DOT_CLASSES: Record<JobStatus, string> = {
  open: "bg-score-strong",
  paused: "bg-score-review",
  draft: "bg-muted",
  closed: "bg-ink",
};

const EMPTY_JOB: Job = {
  id: "new",
  title: "",
  department: "",
  location: "",
  employmentType: "Full-time",
  seniority: "Mid-level",
  status: "draft",
  description: "",
  skills: [],
  scoringWeights: { skills: 40, experience: 40, education: 20 },
  salaryRange: { min: 0, mid: 0, max: 0, source: "Not yet benchmarked", updatedAt: new Date().toISOString().slice(0, 10) },
  applicantCount: 0,
  openDate: new Date().toISOString().slice(0, 10),
  hiringManager: "",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [job, setJob] = useState<Job>(EMPTY_JOB);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);

  const [tone, setTone] = useState<"professional" | "casual" | "concise">("professional");
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState("");
  const [flags, setFlags] = useState<BiasFlag[]>([]);

  useEffect(() => {
    if (isNew || !id) return;
    jobsService.getJobById(id).then((data) => {
      if (!data) {
        setNotFound(true);
      } else {
        setJob(data);
        candidatesService.getCandidatesByJobId(id).then(setCandidates);
      }
      setLoading(false);
    });
  }, [id, isNew]);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await aiContentService.generateJobDescription({
      title: job.title || "this role",
      seniority: job.seniority,
      skills: job.skills,
      location: job.location || "Remote",
      tone,
    });
    setDraft(result);
    setFlags(detectBiasFlags(result));
    setGenerating(false);
  };

  const applyFix = (flag: BiasFlag) => {
    setDraft((prev) => applyBiasFix(prev, flag));
    setFlags((prev) => prev.filter((f) => f.term !== flag.term));
  };

  const useDraft = () => {
    setJob((prev) => ({ ...prev, description: draft }));
    toast({ title: "Description applied", description: "The generated draft was copied into the job description.", variant: "success" });
  };

  const addSkill = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !skillDraft.trim()) return;
    e.preventDefault();
    if (!job.skills.includes(skillDraft.trim())) {
      setJob((prev) => ({ ...prev, skills: [...prev.skills, skillDraft.trim()] }));
    }
    setSkillDraft("");
  };

  const removeSkill = (skill: string) => setJob((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));

  const handleCandidateCreated = (candidate: Candidate) => {
    setCandidates((prev) => [candidate, ...prev]);
    toast({ title: "Candidate added", description: `${candidate.name} was scored and added to this job's pipeline.`, variant: "success" });
  };

  const weightsTotal = job.scoringWeights.skills + job.scoringWeights.experience + job.scoringWeights.education;

  // Proportionally redistributes the other two weights so all three always sum to exactly 100.
  const updateWeight = (key: keyof Job["scoringWeights"], rawValue: number) => {
    setJob((prev) => {
      const weights = prev.scoringWeights;
      const allKeys = ["skills", "experience", "education"] as const;
      const [otherKeyA, otherKeyB] = allKeys.filter((k) => k !== key);
      const newValue = Math.min(100, Math.max(0, Math.round(rawValue)));
      const remaining = 100 - newValue;
      const otherSum = weights[otherKeyA] + weights[otherKeyB];

      const newA = otherSum === 0 ? Math.round(remaining / 2) : Math.round((remaining * weights[otherKeyA]) / otherSum);
      const newB = remaining - newA;

      return {
        ...prev,
        scoringWeights: { ...weights, [key]: newValue, [otherKeyA]: newA, [otherKeyB]: newB },
      };
    });
  };

  const handleSave = async (jobToSave: Job = job) => {
    setSaving(true);
    try {
      if (isNew) {
        const created = await jobsService.createJob(jobToSave);
        toast({ title: "Job created", description: `${created.title} was saved as a draft.`, variant: "success" });
        navigate(`/jobs/${created.id}`, { replace: true });
      } else if (id) {
        await jobsService.updateJob(id, jobToSave);
        toast({ title: "Job updated", variant: "success" });
      }
    } catch (error) {
      toast({
        title: "Couldn't save job",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsDraft = () => {
    const draftJob: Job = { ...job, status: "draft" };
    setJob(draftJob);
    handleSave(draftJob);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        title="Job not found"
        description="This job may have been removed."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/jobs">Back to jobs</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <Link to="/jobs" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Back to jobs
      </Link>
      <PageHeader
        title={isNew ? "New job" : job.title}
        description={
          isNew
            ? "Fill in the details below to create a new requisition."
            : [job.department, job.location, job.seniority].filter(Boolean).join(" · ")
        }
        actions={
          <Button onClick={() => handleSave()} loading={saving}>
            {isNew ? "Create job" : "Save changes"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Job details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="title">Job title</Label>
                  <Input id="title" value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })} placeholder="Senior Frontend Engineer" />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" value={job.department} onChange={(e) => setJob({ ...job, department: e.target.value })} placeholder="Engineering" />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={job.location} onChange={(e) => setJob({ ...job, location: e.target.value })} placeholder="Remote (US)" />
                </div>
                <div>
                  <Label htmlFor="seniority">Seniority</Label>
                  <Input id="seniority" value={job.seniority} onChange={(e) => setJob({ ...job, seniority: e.target.value })} placeholder="Senior" />
                </div>
                <div>
                  <Label>Employment type</Label>
                  <Select value={job.employmentType} onValueChange={(v) => setJob({ ...job, employmentType: v as Job["employmentType"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={job.status} onValueChange={(v) => setJob({ ...job, status: v as JobStatus })}>
                    <SelectTrigger
                      className={cn(
                        "h-auto w-auto gap-1.5 rounded-pill border px-2.5 py-1.5 text-[12.5px] font-medium shadow-none focus:shadow-[var(--ring-accent)]",
                        STATUS_BADGE_CLASSES[job.status]
                      )}
                    >
                      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT_CLASSES[job.status])} />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Required skills</Label>
                <div className="flex flex-wrap gap-1.5 rounded-md border border-line-strong p-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="primary" className="gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    onKeyDown={addSkill}
                    placeholder="Add skill…"
                    className="min-w-[160px] flex-1 bg-transparent px-1 py-1 text-sm text-ink outline-none placeholder:text-muted"
                  />
                </div>
                <p className="mt-1.5 text-[11.5px] text-muted">Press Enter to add a skill.</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="mb-0">
                    Description
                  </Label>
                  <span className="text-[11.5px] text-muted">
                    {job.description.length.toLocaleString()} / {DESCRIPTION_MAX_LENGTH.toLocaleString()} characters
                  </span>
                </div>
                <Textarea
                  id="description"
                  rows={8}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  value={job.description}
                  onChange={(e) => setJob({ ...job, description: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wand2 className="size-4 text-accent" />
                <CardTitle>AI Job Description Generator</CardTitle>
              </div>
              <CardDescription>Generate a draft, then review and apply fixes for any flagged bias language.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {draft ? (
                  <RegenerateButton loading={generating} onClick={handleGenerate} />
                ) : (
                  <Button onClick={handleGenerate} loading={generating}>
                    <Sparkles className="size-4" /> Generate with AI
                  </Button>
                )}
              </div>

              {draft && (
                <div className="space-y-3 rounded-md border border-line bg-sunken/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AiGeneratedTag />
                      <span className="text-[12px] text-muted">Edit directly below, then apply it to the job.</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={useDraft}>
                      Use this draft
                    </Button>
                  </div>
                  <Textarea
                    rows={10}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="bg-surface font-mono text-[12.5px]"
                  />

                  {flags.length > 0 && (
                    <div className="space-y-2 rounded-md border border-line bg-surface p-3">
                      <p className="text-[12px] font-semibold text-heading">{flags.length} potential bias flag{flags.length > 1 ? "s" : ""} detected</p>
                      {flags.map((flag) => (
                        <div key={flag.term} className="flex items-center justify-between gap-3 rounded-md bg-surface p-2.5">
                          <div className="min-w-0">
                            <p className="text-[12.5px] text-ink">
                              "<span className="font-semibold text-error">{flag.term}</span>" → suggest "
                              <span className="font-semibold text-score-strong">{flag.suggestion}</span>"
                            </p>
                            <p className="mt-0.5 text-[11.5px] text-muted">{flag.reason}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => applyFix(flag)}>
                            Apply fix
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scoring weights</CardTitle>
              <CardDescription>How the AI Fit Score is composed for this role.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              <WeightSlider label="Skills" value={job.scoringWeights.skills} onChange={(v) => updateWeight("skills", v)} />
              <WeightSlider label="Experience" value={job.scoringWeights.experience} onChange={(v) => updateWeight("experience", v)} />
              <WeightSlider label="Education" value={job.scoringWeights.education} onChange={(v) => updateWeight("education", v)} />
              <div
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md p-2.5 text-[12px] font-semibold",
                  weightsTotal === 100 ? "bg-score-strong-bg text-score-strong" : "bg-score-review-bg text-score-review"
                )}
              >
                {weightsTotal === 100 ? (
                  <>
                    <Check className="size-3.5" /> Total: {weightsTotal}%
                  </>
                ) : (
                  <>Total: {weightsTotal}% — must equal 100%</>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary benchmarking</CardTitle>
              {job.salaryRange.mid > 0 && (
                <CardDescription>
                  {job.salaryRange.source} · Updated {job.salaryRange.updatedAt}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-2">
              {job.salaryRange.mid > 0 ? (
                <>
                  <div className="flex items-center justify-between text-[12px] text-muted">
                    <span>${(job.salaryRange.min / 1000).toFixed(0)}k</span>
                    <span className="font-semibold text-heading">${(job.salaryRange.mid / 1000).toFixed(0)}k median</span>
                    <span>${(job.salaryRange.max / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="mt-2 h-2 rounded-pill bg-sunken">
                    <div className="relative h-full rounded-pill bg-gradient-brand" style={{ width: "100%" }}>
                      <div
                        className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-brand-navy-900 shadow-sm"
                        style={{ left: "50%" }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-dashed border-line-strong px-3 py-5 text-center">
                  <p className="text-[13px] font-medium text-heading">No benchmark available yet</p>
                  <p className="mt-1 text-[12px] text-muted">
                    Add a title and location, then save this job to see market salary data once it's benchmarked.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {!isNew && (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted" />
                    <CardTitle>Applicants</CardTitle>
                    <Badge variant="neutral">{candidates.length}</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setAddCandidateOpen(true)}>
                    <Plus className="size-3.5" /> Add candidate
                  </Button>
                </div>
                <CardDescription>Manually add a candidate who applied outside the self-service portal.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {candidates.length === 0 ? (
                  <EmptyState
                    icon={<Users className="size-5" />}
                    title="No applicants yet"
                    description="Candidates will appear here as they apply, or add one manually above."
                    className="py-8"
                  />
                ) : (
                  <ul className="space-y-2.5">
                    {candidates
                      .slice()
                      .sort((a, b) => b.fitScore.overall - a.fitScore.overall)
                      .slice(0, 5)
                      .map((c) => (
                        <li key={c.id}>
                          <Link to={`/candidates/${c.id}`} className="flex items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-sunken">
                            <Avatar name={c.name} color={c.avatarColor} size="sm" />
                            <span className="flex-1 truncate text-[13px] text-ink">{c.name}</span>
                            <ScoreBadge score={c.fitScore.overall} />
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
                <Button variant="link" size="sm" className="mt-2" asChild>
                  <Link to="/candidates">View all candidates</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">
        <Button variant="outline" onClick={() => navigate("/jobs")}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleSaveAsDraft} loading={saving}>
          Save as draft
        </Button>
        <Button onClick={() => handleSave()} loading={saving}>
          {isNew ? "Create job" : "Save changes"}
        </Button>
      </div>

      {!isNew && <AddCandidateDrawer job={job} open={addCandidateOpen} onOpenChange={setAddCandidateOpen} onCreated={handleCandidateCreated} />}
    </div>
  );
}

function WeightSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="text-ink">{label}</span>
        <span className="font-mono font-medium text-heading">{value}%</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} max={100} step={5} />
    </div>
  );
}
