import { useEffect, useState } from "react";
import { Check, ClipboardCheck, ClipboardList, Eye, Info, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeadCell, TableRow } from "@/components/ui/Table";
import { ScoreBadge } from "@/components/ai/ScoreBadge";
import { cn } from "@/lib/utils";
import * as assessmentsService from "@/services/assessmentsService";
import type { Assessment, AssessmentResult, IntegrityStatus, QuestionType } from "@/types";

const INTEGRITY_LABEL: Record<IntegrityStatus, string> = {
  clean: "Clean",
  tab_switch: "Tab switch detected",
  expired_link: "Expired link",
};

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  mcq: "MCQ",
  behavioral: "Behavioral",
};

export function RecruiterAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [results, setResults] = useState<Record<string, AssessmentResult[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    assessmentsService.getAssessments().then(async (data) => {
      setAssessments(data);
      setActiveId(data[0]?.id ?? null);
      const entries = await Promise.all(data.map(async (a) => [a.id, await assessmentsService.getResultsByAssessmentId(a.id)] as const));
      setResults(Object.fromEntries(entries));
      setLoading(false);
    });
  }, []);

  const activeAssessment = assessments.find((a) => a.id === activeId);
  const activeResults = activeId ? (results[activeId] ?? []) : [];

  const totalQuestions = assessments.reduce((sum, a) => sum + a.questions.length, 0);
  const totalCandidatesAssessed = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div>
      <PageHeader title="Assessments" description="MCQ and behavioral assessments that feed into each candidate's composite Fit Score." />

      {!loading && assessments.length > 0 && (
        <p className="mb-5 text-[13px] text-muted">
          <span className="font-semibold text-heading">{assessments.length}</span> assessment{assessments.length === 1 ? "" : "s"}
          {" · "}
          <span className="font-semibold text-heading">{totalCandidatesAssessed}</span> candidate{totalCandidatesAssessed === 1 ? "" : "s"} assessed
          {" · "}
          <span className="font-semibold text-heading">{totalQuestions}</span> question{totalQuestions === 1 ? "" : "s"} total
        </p>
      )}

      {loading ? (
        <Skeleton className="h-[420px]" />
      ) : assessments.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-5" />} title="No assessments yet" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-1">
            {assessments.map((a) => (
              <button key={a.id} onClick={() => setActiveId(a.id)} className="block w-full text-left">
                <Card
                  className={cn(
                    "p-4 transition-colors",
                    activeId === a.id ? "border-primary bg-brand-blue-100/40 dark:bg-primary/10" : "hover:bg-sunken/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13.5px] font-semibold text-heading">{a.title}</p>
                    <Badge variant={a.status === "published" ? "success" : "outline"} className="capitalize">
                      {a.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted">{a.jobTitle}</p>
                  <p className="mt-2 text-[11.5px] text-muted">
                    {a.questions.length} questions · {a.weightInFitScore}% of Fit Score
                  </p>
                </Card>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {activeAssessment && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="size-4 text-muted" />
                    <CardTitle>Results — {activeAssessment.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {activeResults.length === 0 ? (
                    <EmptyState
                      icon={<Users className="size-5" />}
                      title="No candidates assessed yet"
                      description="Candidate results will appear here after this assessment is completed."
                      className="py-10"
                    />
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeadCell>Candidate</TableHeadCell>
                            <TableHeadCell>MCQ</TableHeadCell>
                            <TableHeadCell>Behavioral</TableHeadCell>
                            <TableHeadCell>
                              <span className="inline-flex items-center gap-1">
                                Integrity
                                <Tooltip content="Flags sessions with unusual activity, like switching tabs, for recruiter review. It does not confirm dishonesty.">
                                  <Info className="size-3 cursor-help text-muted" />
                                </Tooltip>
                              </span>
                            </TableHeadCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {activeResults.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-[13px] font-medium text-heading">{r.candidateName}</TableCell>
                              <TableCell>
                                <ScoreBadge score={r.mcqScore} />
                              </TableCell>
                              <TableCell>
                                <ScoreBadge score={r.behavioralScore} />
                              </TableCell>
                              <TableCell>
                                <Badge variant={r.integrityStatus === "clean" ? "success" : "warning"}>
                                  {r.integrityStatus !== "clean" && <Eye className="size-3" />}
                                  {INTEGRITY_LABEL[r.integrityStatus]}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}

            {activeAssessment && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 pt-2">
                  {activeAssessment.questions.map((q, i) => (
                    <div key={q.id} className="rounded-md border border-line p-3.5">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-eyebrow text-muted">
                        Question {i + 1} · {QUESTION_TYPE_LABEL[q.type]}
                      </p>
                      <p className="text-[13.5px] font-medium text-heading">{q.prompt}</p>
                      {q.options && (
                        <ul className="mt-2.5 space-y-1.5">
                          {q.options.map((opt, idx) => {
                            const isCorrect = idx === q.correctOptionIndex;
                            return (
                              <li
                                key={opt}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px]",
                                  isCorrect ? "bg-score-strong-bg font-medium text-score-strong" : "text-muted"
                                )}
                              >
                                {isCorrect ? <Check className="size-3.5 shrink-0" /> : <span className="size-3.5 shrink-0" />}
                                {opt}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {q.type === "behavioral" && (
                        <p className="mt-2.5 text-[11.5px] text-muted">Scored as part of each candidate's Behavioral score.</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
