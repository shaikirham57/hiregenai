import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarClock, Sparkles, Video } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Drawer, DrawerContent } from "@/components/ui/Drawer";
import * as interviewsService from "@/services/interviewsService";
import type { Interview, InterviewStatus } from "@/types";

const STATUS_VARIANT: Record<InterviewStatus, "primary" | "success" | "neutral"> = {
  scheduled: "primary",
  completed: "success",
  canceled: "neutral",
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [kitInterview, setKitInterview] = useState<Interview | null>(null);

  useEffect(() => {
    interviewsService.getInterviews().then((data) => {
      setInterviews(data);
      setLoading(false);
    });
  }, []);

  const renderList = (items: Interview[]) =>
    items.length === 0 ? (
      <EmptyState icon={<Video className="size-5" />} title="No interviews here" />
    ) : (
      <div className="space-y-2.5">
        {items.map((interview) => (
          <Card key={interview.id} className="p-3.5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={interview.candidateName} color="#0053FE" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-heading">{interview.candidateName}</p>
                <p className="truncate text-[12px] text-muted">{interview.jobTitle}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-muted">
                  <CalendarClock className="size-3 shrink-0" />
                  {format(new Date(interview.scheduledAt), "MMM d, yyyy 'at' h:mm a")} · {interview.interviewer}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[interview.status]} className="capitalize">
                {interview.status}
              </Badge>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setKitInterview(interview)}>
                  <Sparkles className="size-3.5" /> Question kit
                </Button>
                {interview.status === "completed" && (
                  <Button size="sm" asChild>
                    <Link to={`/interviews/${interview.id}/results`}>View results</Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );

  const scheduledCount = interviews.filter((i) => i.status === "scheduled").length;
  const completedCount = interviews.filter((i) => i.status === "completed").length;
  const needsReviewCount = interviews.filter((i) => i.recommendation === "hold").length;

  return (
    <div>
      <PageHeader title="AI Interviews" description="Auto-generated, gap-focused interview questions for every candidate." />

      {!loading && (
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-eyebrow text-muted">Total</p>
            <p className="text-[18px] font-bold text-heading">{interviews.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-eyebrow text-muted">Scheduled</p>
            <p className="text-[18px] font-bold text-heading">{scheduledCount}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-eyebrow text-muted">Completed</p>
            <p className="text-[18px] font-bold text-heading">{completedCount}</p>
          </div>
          {needsReviewCount > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-eyebrow text-score-review">Needs review</p>
              <p className="text-[18px] font-bold text-score-review">{needsReviewCount}</p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-5">
            <TabsTrigger value="all">All ({interviews.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderList(interviews)}</TabsContent>
          <TabsContent value="scheduled">{renderList(interviews.filter((i) => i.status === "scheduled"))}</TabsContent>
          <TabsContent value="completed">{renderList(interviews.filter((i) => i.status === "completed"))}</TabsContent>
        </Tabs>
      )}

      <Drawer open={!!kitInterview} onOpenChange={(open) => !open && setKitInterview(null)}>
        {kitInterview && (
          <DrawerContent title="AI-generated question kit" description={`For ${kitInterview.candidateName} · ${kitInterview.jobTitle}`}>
            <QuestionKitContent interview={kitInterview} />
          </DrawerContent>
        )}
      </Drawer>
    </div>
  );
}

function QuestionKitContent({ interview }: { interview: Interview }) {
  const technicalQuestions = interview.questions.filter((q) => q.type === "technical");
  const behavioralQuestions = interview.questions.filter((q) => q.type === "behavioral");
  const total = interview.questions.length;
  const technicalPercent = total > 0 ? Math.round((technicalQuestions.length / total) * 100) : 0;
  const behavioralPercent = total > 0 ? 100 - technicalPercent : 0;

  const renderQuestion = (q: Interview["questions"][number], index: number) => (
    <div key={q.id} className="rounded-md border border-line p-3">
      <p className="text-[13px] text-ink">
        {index + 1}. {q.prompt}
      </p>
      {q.targetGap && <p className="mt-1.5 text-[11.5px] text-muted">Targets resume gap: {q.targetGap}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      {total > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[12px] font-medium text-ink">
            <span>
              Technical {technicalPercent}% · Behavioral {behavioralPercent}%
            </span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-pill bg-sunken">
            <div className="h-full bg-primary" style={{ width: `${technicalPercent}%` }} />
            <div className="h-full bg-accent" style={{ width: `${behavioralPercent}%` }} />
          </div>
        </div>
      )}

      {technicalQuestions.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> Technical questions
          </p>
          <div className="space-y-2.5">{technicalQuestions.map((q, i) => renderQuestion(q, i))}</div>
        </div>
      )}

      {behavioralQuestions.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-accent">
            <span className="size-1.5 rounded-full bg-accent" /> Behavioral questions
          </p>
          <div className="space-y-2.5">{behavioralQuestions.map((q, i) => renderQuestion(q, i))}</div>
        </div>
      )}

      <CardContent className="rounded-md border border-line bg-sunken p-3 text-[12px] text-muted">
        Questions are generated from the candidate's resume gaps and this role's scoring weights.
      </CardContent>
    </div>
  );
}
