import { useEffect, useMemo, useState } from "react";
import { BarChart3, Clock, Gauge, Info, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { KpiTile } from "@/components/charts/KpiTile";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { SkillsBarChart } from "@/components/charts/SkillsBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import * as analyticsService from "@/services/analyticsService";
import type { AnalyticsSnapshot } from "@/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);

  useEffect(() => {
    analyticsService.getAnalyticsSnapshot().then(setData);
  }, []);

  const funnelConversions = useMemo(() => {
    if (!data) return [];
    return data.funnel.slice(1).map((stage, i) => {
      const prev = data.funnel[i];
      const rate = prev.count > 0 ? Math.round((stage.count / prev.count) * 100) : 0;
      return { from: prev.stage, to: stage.stage, rate };
    });
  }, [data]);

  const totalHires = useMemo(() => data?.hiresByMonth.reduce((sum, p) => sum + p.value, 0) ?? 0, [data]);

  const topSkill = useMemo(() => {
    if (!data || data.topSkills.length === 0) return null;
    return [...data.topSkills].sort((a, b) => b.count - a.count)[0];
  }, [data]);

  const biggestDropOff = useMemo(() => {
    if (funnelConversions.length === 0) return null;
    return [...funnelConversions].sort((a, b) => a.rate - b.rate)[0];
  }, [funnelConversions]);

  return (
    <div>
      <PageHeader title="Analytics" description="Pipeline health, hiring velocity, and skills demand across your open roles." />

      {!data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile
              label="Time to hire"
              value={`${data.timeToHireDays}d`}
              icon={Clock}
              trend={data.timeToHireTrend}
              invertTrendColor
              tooltip="Average number of days from a candidate's application to an accepted offer."
            />
            <KpiTile
              label="Offer acceptance"
              value={`${data.offerAcceptanceRate}%`}
              icon={TrendingUp}
              trend={5.4}
              tooltip="Share of extended offers that candidates accepted."
            />
            <KpiTile
              label="Avg. Fit Score"
              value={String(data.avgFitScore)}
              icon={Sparkles}
              trend={2.9}
              tooltip="Average AI Fit Score across all current applicants, based on skills, experience, and education match."
            />
            <KpiTile
              label="Resume authenticity"
              value={`${data.resumeAuthenticityRate}%`}
              icon={ShieldCheck}
              trend={0.8}
              tooltip="Share of submitted resumes that passed AI authenticity checks with no significant inconsistencies flagged."
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-muted" />
                  <CardTitle>Hiring funnel</CardTitle>
                </div>
                <CardDescription>Applicants at each pipeline stage across all open roles.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <FunnelChart data={data.funnel} />
                {funnelConversions.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    {funnelConversions.map((c) => (
                      <Badge key={`${c.from}-${c.to}`} variant="outline" className="font-normal">
                        {c.from} → {c.to} <span className="font-mono font-semibold text-ink">{c.rate}%</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Top in-demand skills</CardTitle>
                  <Tooltip content="Number of current applicants whose resume matches each skill.">
                    <Info className="size-3.5 cursor-help text-muted" />
                  </Tooltip>
                </div>
                <CardDescription>Most frequently matched skills across current applicants.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <SkillsBarChart data={data.topSkills} />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hires by month</CardTitle>
              <CardDescription>
                {totalHires} candidate{totalHires === 1 ? "" : "s"} hired over the last {data.hiresByMonth.length} months.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <TrendLineChart data={data.hiresByMonth} />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-accent" />
                <CardTitle>AI Hiring Insights</CardTitle>
              </div>
              <CardDescription>Patterns spotted across your current pipeline, funnel, and skills data.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 rounded-md border border-line p-3">
                {data.timeToHireTrend <= 0 ? (
                  <TrendingDown className="size-4 shrink-0 text-score-strong" />
                ) : (
                  <TrendingUp className="size-4 shrink-0 text-score-weak" />
                )}
                <p className="text-[12.5px] leading-relaxed text-ink">
                  Hiring velocity has {data.timeToHireTrend <= 0 ? "improved" : "slowed"} by {Math.abs(data.timeToHireTrend)}%, now averaging{" "}
                  <span className="font-semibold">{data.timeToHireDays} days</span> to hire.
                </p>
              </div>
              {biggestDropOff && (
                <div className="flex items-start gap-2.5 rounded-md border border-line p-3">
                  <BarChart3 className="size-4 shrink-0 text-score-review" />
                  <p className="text-[12.5px] leading-relaxed text-ink">
                    The largest pipeline drop-off is <span className="font-semibold">{biggestDropOff.from} → {biggestDropOff.to}</span>, with only{" "}
                    <span className="font-semibold">{biggestDropOff.rate}%</span> of candidates advancing.
                  </p>
                </div>
              )}
              {topSkill && (
                <div className="flex items-start gap-2.5 rounded-md border border-line p-3">
                  <Gauge className="size-4 shrink-0 text-primary" />
                  <p className="text-[12.5px] leading-relaxed text-ink">
                    <span className="font-semibold">{topSkill.skill}</span> is the most in-demand skill, matched by{" "}
                    <span className="font-semibold">{topSkill.count}</span> current applicants.
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2.5 rounded-md border border-line p-3">
                <TrendingUp className="size-4 shrink-0 text-score-strong" />
                <p className="text-[12.5px] leading-relaxed text-ink">
                  <span className="font-semibold">{data.offerAcceptanceRate}%</span> of extended offers are being accepted by candidates.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
