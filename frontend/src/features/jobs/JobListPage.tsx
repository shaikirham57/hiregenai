import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, Plus, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import * as jobsService from "@/services/jobsService";
import type { Job, JobStatus } from "@/types";

const STATUS_VARIANT: Record<JobStatus, "success" | "warning" | "neutral" | "outline"> = {
  open: "success",
  paused: "warning",
  draft: "outline",
  closed: "neutral",
};

export default function JobListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");

  useEffect(() => {
    jobsService.getJobs().then((data) => {
      setJobs(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesQuery = query.trim() === "" || job.title.toLowerCase().includes(query.toLowerCase()) || job.department.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || job.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [jobs, query, status]);

  return (
    <div>
      <PageHeader
        title="Job Management"
        description="Create, publish, and manage open requisitions."
        actions={
          <Button asChild>
            <Link to="/jobs/new">
              <Plus className="size-4" /> New job
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input placeholder="Search by title or department..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as JobStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Briefcase className="size-5" />} title="No jobs found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`}>
              <Card className="h-full p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold text-heading">{job.title}</h3>
                    <p className="mt-0.5 text-[13px] text-muted">{job.department}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[job.status]} className="capitalize">
                    {job.status}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {job.applicantCount} applicants
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="neutral">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
