import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, CheckCircle2, MapPin, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { ScoreBadge } from "@/components/ai/ScoreBadge";
import * as jobsService from "@/services/jobsService";
import * as applicationsService from "@/services/applicationsService";
import * as aiScoringService from "@/services/aiScoringService";
import { useAuth } from "@/hooks/useAuth";
import { getScoreTier, SCORE_TIER_LABEL, type ScoreTier } from "@/lib/scoreTier";
import type { Job } from "@/types";

const ALL = "all";
const SCORE_TIERS: ScoreTier[] = ["strong", "review", "weak"];

export default function FindJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [employmentType, setEmploymentType] = useState(ALL);
  const [seniorityFilter, setSeniorityFilter] = useState(ALL);
  const [matchFilter, setMatchFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);

  useEffect(() => {
    jobsService.getJobs().then(async (data) => {
      const openJobs = data.filter((j) => j.status === "open");
      setJobs(openJobs);

      if (user) {
        const applications = await applicationsService.getApplicationsByCandidateId(user.id);
        setAppliedJobIds(new Set(applications.map((a) => a.jobId)));

        // Existing per-application match scores, where already computed at apply time.
        const scores: Record<string, number> = {};
        applications.forEach((a) => {
          if (a.matchScore !== undefined) scores[a.jobId] = a.matchScore;
        });

        // For jobs not yet applied to, preview the match using the candidate's most recently
        // submitted background — reusing the exact same scoring function applications already
        // use, rather than inventing a new one. If no background exists yet, no score is shown.
        const profileApp = [...applications]
          .filter((a) => a.background)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

        if (profileApp?.background) {
          const input = {
            skills: profileApp.background.skills,
            yearsExperience: profileApp.background.isFresher ? 0 : profileApp.background.yearsExperience,
            education: profileApp.background.education,
          };
          await Promise.all(
            openJobs.map(async (job) => {
              if (scores[job.id] !== undefined) return;
              const fit = await aiScoringService.scoreCandidateAgainstJob(input, job);
              scores[job.id] = fit.overall;
            })
          );
        }
        setMatchScores(scores);
      }
      setLoading(false);
    });
  }, [user]);

  const departments = useMemo(() => Array.from(new Set(jobs.map((j) => j.department))).sort(), [jobs]);
  const locations = useMemo(() => Array.from(new Set(jobs.map((j) => j.location))).sort(), [jobs]);
  const employmentTypes = useMemo(() => Array.from(new Set(jobs.map((j) => j.employmentType))).sort(), [jobs]);
  const seniorities = useMemo(() => Array.from(new Set(jobs.map((j) => j.seniority))).sort(), [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesQuery = !q || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q) || j.skills.some((s) => s.toLowerCase().includes(q));
      const matchesDepartment = department === ALL || j.department === department;
      const matchesLocation = location === ALL || j.location === location;
      const matchesType = employmentType === ALL || j.employmentType === employmentType;
      const matchesSeniority = seniorityFilter === ALL || j.seniority === seniorityFilter;
      const score = matchScores[j.id];
      const matchesScore = matchFilter === ALL || (score !== undefined && getScoreTier(score) === matchFilter);
      const applied = appliedJobIds.has(j.id);
      const matchesStatus = statusFilter === ALL || (statusFilter === "applied" ? applied : !applied);
      return matchesQuery && matchesDepartment && matchesLocation && matchesType && matchesSeniority && matchesScore && matchesStatus;
    });
  }, [jobs, query, department, location, employmentType, seniorityFilter, matchFilter, statusFilter, matchScores, appliedJobIds]);

  return (
    <div>
      <PageHeader
        title="Find Jobs"
        description={
          user
            ? "Browse open roles and apply directly — HireGen AI screens your resume the moment you apply."
            : "Browse our open roles below. You'll create a free account when you're ready to apply."
        }
      />

      <div className="mb-6 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input placeholder="Search by title, department, or skill..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={employmentType} onValueChange={setEmploymentType}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {employmentTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={seniorityFilter} onValueChange={setSeniorityFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All experience levels</SelectItem>
              {seniorities.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {user && (
            <>
              <Select value={matchFilter} onValueChange={setMatchFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Match score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All match scores</SelectItem>
                  {SCORE_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {SCORE_TIER_LABEL[tier]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Application status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All applications</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="not_applied">Not applied</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[190px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Briefcase className="size-5" />} title="No open roles found" description="Try a different search or filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((job) => {
            const applied = appliedJobIds.has(job.id);
            const score = matchScores[job.id];

            return (
              <Card key={job.id} className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
                <Link to={`/find-jobs/${job.id}`} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-heading hover:text-primary">{job.title}</h3>
                    <p className="mt-0.5 truncate text-[13px] text-muted">
                      {job.department} · {job.seniority} · {job.employmentType}
                    </p>
                  </div>
                  {score !== undefined && <ScoreBadge score={score} className="shrink-0" />}
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {job.applicantCount} applicants
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-score-strong" /> Open
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="neutral">
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex flex-1 items-end justify-between gap-2 border-t border-line pt-3">
                  {applied ? (
                    <>
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="size-3" /> Applied
                      </Badge>
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/my-applications">View application</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-[11.5px] text-muted">
                        {score !== undefined ? SCORE_TIER_LABEL[getScoreTier(score)] : "Apply to see your AI match"}
                      </span>
                      <Button size="sm" asChild>
                        <Link to={`/find-jobs/${job.id}`}>Apply now</Link>
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
