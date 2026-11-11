import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, Check, RefreshCw, Sparkles, ThumbsUp, TriangleAlert, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeadCell, TableRow } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { ScoreBadge } from "@/components/ai/ScoreBadge";
import { RiskBadge } from "@/components/ai/RiskBadge";
import { FitScoreBar } from "@/components/ai/FitScoreBar";
import { XaiDrawer } from "@/components/ai/XaiDrawer";
import * as candidatesService from "@/services/candidatesService";
import * as jobsService from "@/services/jobsService";
import { useToast } from "@/hooks/useToast";
import { sleep } from "@/lib/utils";
import { getScoreTier } from "@/lib/scoreTier";
import type { Candidate, Job } from "@/types";

export default function RankingPage() {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [xaiCandidate, setXaiCandidate] = useState<Candidate | null>(null);
  const [rescoring, setRescoring] = useState(false);
  const [rescoreProgress, setRescoreProgress] = useState(0);
  const [rescoreConfirmOpen, setRescoreConfirmOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    Promise.all([candidatesService.getCandidates(), jobsService.getJobs()]).then(([c, j]) => {
      setCandidates(c);
      setJobs(j);
      setLoading(false);
    });
  }, []);

  const jobTitle = (jobId: string) => jobs.find((j) => j.id === jobId)?.title ?? "—";

  const ranked = useMemo(() => {
    const filtered = jobFilter === "all" ? candidates : candidates.filter((c) => c.appliedJobId === jobFilter);
    return [...filtered].sort((a, b) => b.fitScore.overall - a.fitScore.overall);
  }, [candidates, jobFilter]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === ranked.length ? new Set() : new Set(ranked.map((c) => c.id))));
  };

  const summaryCounts = useMemo(() => {
    const counts = { strong: 0, review: 0, weak: 0 };
    ranked.forEach((c) => {
      counts[getScoreTier(c.fitScore.overall)]++;
    });
    return counts;
  }, [ranked]);

  const runBatchRescore = async () => {
    setRescoring(true);
    setRescoreProgress(0);
    const total = ranked.length;
    for (let i = 1; i <= total; i++) {
      await sleep(35);
      setRescoreProgress(Math.round((i / total) * 100));
    }
    await sleep(200);
    setRescoring(false);
  };

  const confirmRescoreAll = () => {
    setRescoreConfirmOpen(false);
    runBatchRescore();
  };

  const bulkShortlist = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    const updates = await Promise.all(ids.map((id) => candidatesService.updateCandidateStage(id, "screened")));
    setCandidates((prev) => prev.map((c) => updates.find((u) => u?.id === c.id) ?? c));
    toast({ title: "Candidates shortlisted", description: `${ids.length} candidate${ids.length === 1 ? "" : "s"} moved to Screened.`, variant: "success" });
    setSelected(new Set());
    setBulkActionLoading(false);
  };

  return (
    <div>
      <PageHeader
        title="AI Match Score & Candidate Ranking"
        description="Auto-ranked shortlists, scored end-to-end on skills, experience, and education."
        actions={
          <Button onClick={() => setRescoreConfirmOpen(true)} loading={rescoring} variant="outline">
            <RefreshCw className="size-4" /> Re-score all
          </Button>
        }
      />

      {rescoring && (
        <div className="mb-5 rounded-md border border-line bg-surface p-3">
          <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
            <span className="text-ink">Scoring {ranked.length} applicants...</span>
            <span className="font-mono text-muted">{rescoreProgress}%</span>
          </div>
          <Progress value={rescoreProgress} />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-muted">Show rankings for</label>
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="All jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-ink">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={bulkShortlist} loading={bulkActionLoading}>
              <ThumbsUp className="size-3.5" /> Shortlist
            </Button>
          </div>
        )}
      </div>

      {!loading && ranked.length > 0 && (
        <p className="mb-3 text-[13px] text-muted">
          <span className="font-semibold text-heading">{ranked.length}</span> candidate{ranked.length === 1 ? "" : "s"} ranked
          {" · "}
          <span className="font-semibold text-score-strong">{summaryCounts.strong}</span> strong match{summaryCounts.strong === 1 ? "" : "es"}
          {" · "}
          <span className="font-semibold text-score-review">{summaryCounts.review}</span> need{summaryCounts.review === 1 ? "s" : ""} review
          {" · "}
          <span className="font-semibold text-score-weak">{summaryCounts.weak}</span> weak match{summaryCounts.weak === 1 ? "" : "es"}
        </p>
      )}

      {loading ? (
        <Skeleton className="h-[420px]" />
      ) : ranked.length === 0 ? (
        <EmptyState icon={<Trophy className="size-5" />} title="No candidates to rank" description="Try selecting a different job." />
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell className="w-12">Rank</TableHeadCell>
                <TableHeadCell className="w-10">
                  <Checkbox checked={selected.size === ranked.length} onCheckedChange={toggleAll} />
                </TableHeadCell>
                <TableHeadCell>Candidate</TableHeadCell>
                <TableHeadCell className="w-[130px]">
                  <span className="flex items-center gap-1">
                    Fit score <ArrowUpDown className="size-3" />
                  </span>
                </TableHeadCell>
                <TableHeadCell className="w-[220px]">Sub-scores</TableHeadCell>
                <TableHeadCell className="w-[220px]">Key Match / Gap</TableHeadCell>
                <TableHeadCell>Risk</TableHeadCell>
                <TableHeadCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {ranked.map((c, index) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="flex size-7 items-center justify-center rounded-full bg-sunken text-[12.5px] font-bold text-heading">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSelected(c.id)} />
                  </TableCell>
                  <TableCell>
                    <Link to={`/candidates/${c.id}`} className="flex items-center gap-2.5">
                      <Avatar name={c.name} color={c.avatarColor} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-heading">{c.name}</p>
                        <p className="truncate text-[12px] text-muted">{jobTitle(c.appliedJobId)}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ScoreBadge score={c.fitScore.overall} showLabel className="text-[13px]" />
                    {c.fitScore.confidence === "low" && (
                      <p className="mt-1 text-[10.5px] font-medium text-score-review">Low data confidence</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <FitScoreBar label="Skills" value={c.fitScore.skills} />
                      <FitScoreBar label="Experience" value={c.fitScore.experience} />
                      <FitScoreBar label="Education" value={c.fitScore.education} />
                    </div>
                  </TableCell>
                  <TableCell className="text-[12.5px]">
                    <div className="flex flex-col items-start gap-1">
                      {c.fitScore.matchedSkills[0] ? (
                        <span className="inline-flex max-w-full items-center gap-1 truncate rounded-pill bg-score-strong-bg px-2 py-0.5 font-medium text-score-strong">
                          <Check className="size-3 shrink-0" /> <span className="truncate">{c.fitScore.matchedSkills[0]}</span>
                        </span>
                      ) : (
                        <span className="text-muted">No matched skills</span>
                      )}
                      {c.fitScore.missingSkills[0] ? (
                        <span className="inline-flex max-w-full items-center gap-1 truncate rounded-pill bg-score-weak-bg px-2 py-0.5 font-medium text-score-weak">
                          <TriangleAlert className="size-3 shrink-0" /> <span className="truncate">{c.fitScore.missingSkills[0]}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-score-strong-bg px-2 py-0.5 font-medium text-score-strong">
                          <Check className="size-3 shrink-0" /> No gaps
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <RiskBadge level={c.riskLevel} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setXaiCandidate(c)}>
                      <Sparkles className="size-3.5" /> Why?
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {xaiCandidate && <XaiDrawer candidate={xaiCandidate} open={!!xaiCandidate} onOpenChange={(open) => !open && setXaiCandidate(null)} />}

      <Modal open={rescoreConfirmOpen} onOpenChange={setRescoreConfirmOpen}>
        <ModalContent title="Re-score all candidates?" description="This will recalculate Fit Scores using the current job criteria.">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRescoreConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRescoreAll}>Re-score candidates</Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
