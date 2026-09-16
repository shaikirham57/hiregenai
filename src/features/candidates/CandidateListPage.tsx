import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Filter, Info, Search, Sparkles, Users, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Table, TableContainer, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from "@/components/ui/Table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tooltip } from "@/components/ui/Tooltip";
import { ScoreBadge } from "@/components/ai/ScoreBadge";
import { RiskBadge } from "@/components/ai/RiskBadge";
import { StatusPill } from "@/components/ai/StatusPill";
import { PipelineBoard } from "@/features/candidates/PipelineBoard";
import * as candidatesService from "@/services/candidatesService";
import * as jobsService from "@/services/jobsService";
import { cn } from "@/lib/utils";
import { getScoreTier, SCORE_TIER_LABEL } from "@/lib/scoreTier";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type Candidate, type Job, type RiskLevel } from "@/types";

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];
const RISK_LABEL: Record<RiskLevel, string> = { low: "Low risk", medium: "Medium risk", high: "High risk" };
const SCORE_TIERS = ["strong", "review", "weak"] as const;
const STAGE_FILTER_OPTIONS = [...PIPELINE_STAGES, "rejected"] as const;

export default function CandidateListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobFilter = searchParams.get("job");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"keyword" | "semantic">("keyword");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [jobIdFilter, setJobIdFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");

  useEffect(() => {
    Promise.all([candidatesService.getCandidates(), jobsService.getJobs()]).then(([c, j]) => {
      setCandidates(c);
      setJobs(j);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearching(true);
      candidatesService.searchCandidates(query, mode).then((results) => {
        setCandidates(jobFilter ? results.filter((c) => c.appliedJobId === jobFilter) : results);
        setSearching(false);
      });
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mode, jobFilter]);

  const jobTitle = (jobId: string) => jobs.find((j) => j.id === jobId)?.title ?? "—";

  const activeJobName = useMemo(() => (jobFilter ? jobs.find((j) => j.id === jobFilter)?.title : null), [jobFilter, jobs]);

  const availableSkills = useMemo(() => Array.from(new Set(candidates.flatMap((c) => c.skills))).sort(), [candidates]);

  const activeFilterCount = [jobIdFilter, stageFilter, scoreFilter, riskFilter, skillFilter, experienceFilter].filter((v) => v !== "all").length;

  const clearFilters = () => {
    setJobIdFilter("all");
    setStageFilter("all");
    setScoreFilter("all");
    setRiskFilter("all");
    setSkillFilter("all");
    setExperienceFilter("all");
  };

  const visibleCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (jobIdFilter !== "all" && c.appliedJobId !== jobIdFilter) return false;
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (scoreFilter !== "all" && getScoreTier(c.fitScore.overall) !== scoreFilter) return false;
      if (riskFilter !== "all" && c.riskLevel !== riskFilter) return false;
      if (skillFilter !== "all" && !c.skills.includes(skillFilter)) return false;
      if (experienceFilter !== "all" && getScoreTier(c.fitScore.experience) !== experienceFilter) return false;
      return true;
    });
  }, [candidates, jobIdFilter, stageFilter, scoreFilter, riskFilter, skillFilter, experienceFilter]);

  const updateCandidate = (updated: Candidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <div>
      <PageHeader
        title="Candidate Management"
        description={activeJobName ? `Showing applicants for ${activeJobName}` : "Search, review, and manage every candidate in your pipeline."}
      />

      <Tabs defaultValue="list">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-md border border-line-strong bg-surface p-1">
            <button
              onClick={() => setMode("keyword")}
              className={cn("rounded-sm px-3 py-1.5 text-[12.5px] font-medium transition-colors", mode === "keyword" ? "bg-sunken text-heading" : "text-muted")}
            >
              Keyword
            </button>
            <button
              onClick={() => setMode("semantic")}
              className={cn("flex items-center gap-1 rounded-sm px-3 py-1.5 text-[12.5px] font-medium transition-colors", mode === "semantic" ? "bg-sunken text-heading" : "text-muted")}
            >
              <Sparkles className="size-3" /> Semantic
            </button>
          </div>
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === "semantic" ? "Describe the ideal candidate..." : "Search by name, skill, or education..."}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen((prev) => !prev)}>
            <Filter className="size-3.5" /> Filters
            {activeFilterCount > 0 && <Badge variant="primary">{activeFilterCount}</Badge>}
          </Button>
          <TabsList>
            <TabsTrigger value="list">List view</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline view</TabsTrigger>
          </TabsList>
        </div>

        {filtersOpen && (
          <div className="mb-5 flex flex-wrap items-end gap-3 rounded-md border border-line bg-surface p-3">
            <div className="w-[160px]">
              <label className="mb-1 block text-[11.5px] font-medium text-muted">Job</label>
              <Select value={jobIdFilter} onValueChange={setJobIdFilter}>
                <SelectTrigger className="h-[34px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All jobs</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <label className="mb-1 block text-[11.5px] font-medium text-muted">Stage</label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-[34px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {STAGE_FILTER_OPTIONS.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {PIPELINE_STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <label className="mb-1 block text-[11.5px] font-medium text-muted">Fit score</label>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="h-[34px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All scores</SelectItem>
                  {SCORE_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {SCORE_TIER_LABEL[tier]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <label className="mb-1 block text-[11.5px] font-medium text-muted">Risk</label>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="h-[34px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk levels</SelectItem>
                  {RISK_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {RISK_LABEL[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <label className="mb-1 block text-[11.5px] font-medium text-muted">Skills</label>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="h-[34px] text-[12.5px]">
                  <SelectValue />
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
            </div>
            <div className="w-[150px]">
              <label className="mb-1 block text-[11.5px] font-medium text-muted">Experience</label>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger className="h-[34px] text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All experience</SelectItem>
                  {SCORE_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {SCORE_TIER_LABEL[tier]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="size-3.5" /> Clear filters
              </Button>
            )}
          </div>
        )}

        <TabsContent value="list">
          {loading ? (
            <Skeleton className="h-[420px]" />
          ) : visibleCandidates.length === 0 ? (
            <EmptyState icon={<Users className="size-5" />} title="No candidates found" description="Try a different search or filter." />
          ) : (
            <TableContainer className={cn("transition-opacity", searching && "opacity-60")}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Candidate</TableHeadCell>
                    <TableHeadCell>Applied for</TableHeadCell>
                    <TableHeadCell>
                      <span className="inline-flex items-center gap-1">
                        Fit score
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
                          <Info className="size-3 cursor-help text-muted" />
                        </Tooltip>
                      </span>
                    </TableHeadCell>
                    <TableHeadCell>Risk</TableHeadCell>
                    <TableHeadCell>Stage</TableHeadCell>
                    <TableHeadCell>Action</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleCandidates.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/candidates/${c.id}`)}>
                      <TableCell>
                        <Link to={`/candidates/${c.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2.5">
                          <Avatar name={c.name} color={c.avatarColor} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-heading">{c.name}</p>
                            <p className="truncate text-[12px] text-muted">{c.location}</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-[13px]">{jobTitle(c.appliedJobId)}</TableCell>
                      <TableCell>
                        <ScoreBadge score={c.fitScore.overall} />
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={c.riskLevel} />
                      </TableCell>
                      <TableCell>
                        <StatusPill stage={c.stage} />
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                          <Link to={`/candidates/${c.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabsContent>

        <TabsContent value="pipeline">
          {loading ? <Skeleton className="h-[420px]" /> : <PipelineBoard candidates={visibleCandidates} onCandidateUpdate={updateCandidate} jobTitleFor={jobTitle} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
