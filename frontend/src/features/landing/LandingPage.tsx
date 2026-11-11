import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Trophy,
  Video,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScoreGauge } from "@/components/ai/ScoreGauge";
import { FitScoreBar } from "@/components/ai/FitScoreBar";
import { AiGeneratedTag } from "@/components/ai/AiGeneratedTag";

const STATS = [
  { value: "97%", label: "less manual shortlisting effort" },
  { value: "38%", label: "better candidate-job relevance" },
  { value: "30–45%", label: "higher interview-to-offer conversion" },
  { value: "100%", label: "explainable AI scoring" },
];

const FEATURES = [
  { icon: ScanSearch, title: "AI Resume Screening", description: "Parse and structure resumes in seconds with automatic skill, education, and experience extraction." },
  { icon: Radar, title: "AI Match Score", description: "A transparent 0–100 Fit Score with skill, experience, and education sub-scores — never a black box." },
  { icon: Trophy, title: "Candidate Ranking", description: "Auto-ranked, sortable shortlists so your best-fit candidates rise to the top instantly." },
  { icon: ClipboardList, title: "Assessments", description: "MCQ and behavioral assessments that feed directly into each candidate's composite Fit Score." },
  { icon: Video, title: "AI Interviews", description: "Auto-generated, gap-focused interview questions and structured rubric scoring." },
  { icon: BarChart3, title: "Analytics", description: "Pipeline health, time-to-hire, and skills-demand insights refreshed in real time." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand-soft dark:opacity-[0.06]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-line-strong bg-surface px-3 py-1.5 text-[12px] font-medium text-muted">
              <Sparkles className="size-3.5 text-accent" />
              AI-Powered Recruitment
            </span>
            <h1 className="mt-5 font-display text-[2.75rem] font-bold leading-[1.1] text-heading sm:text-[3.25rem]">
              Smarter Hiring. <span className="text-gradient-brand">Better Futures.</span>
            </h1>
            <p className="mt-5 max-w-lg text-body-lg text-muted">
              HireGen AI screens resumes, scores candidates, and runs AI-assisted interviews — with fully explainable
              reasoning at every step, so your team hires faster without hiring blind.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" variant="gradient" asChild>
                <Link to="/register">
                  Get started free <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Log in</Link>
              </Button>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl font-bold text-heading">{stat.value}</dt>
                  <dd className="mt-1 text-[12px] text-muted">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Card className="p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-muted">Senior Frontend Engineer</p>
                <p className="text-[15px] font-semibold text-heading">Elena Marchetti</p>
              </div>
              <AiGeneratedTag label="AI scored" />
            </div>
            <div className="mt-4 flex items-center gap-5 rounded-lg bg-sunken p-4">
              <ScoreGauge score={91} label="Fit score" size={84} />
              <div className="flex-1 space-y-2.5">
                <FitScoreBar label="Skills" value={94} />
                <FitScoreBar label="Experience" value={90} />
                <FitScoreBar label="Education" value={85} />
              </div>
            </div>
            <p className="mt-4 rounded-md border border-line bg-canvas p-3 text-[13px] leading-relaxed text-ink">
              "Elena's skill profile is a near-exact match for the role, with direct production experience in all core
              requirements."
            </p>
            <div className="mt-4 flex items-center gap-2 text-[12px] text-muted">
              <ShieldCheck className="size-3.5 text-score-strong" />
              Resume authenticity verified · Low risk
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-h1 font-bold text-heading">Every stage of hiring, AI-assisted</h2>
          <p className="mt-3 text-body-lg text-muted">
            From the first resume upload to the final offer, HireGen AI gives your team explainable AI insight at
            every step.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="p-6">
              <div className="flex size-10 items-center justify-center rounded-md bg-brand-blue-100 text-primary dark:bg-primary/15">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-heading">{feature.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="rounded-xl bg-gradient-brand px-8 py-14 text-center text-white sm:px-16">
          <h2 className="font-display text-h1 font-bold">Ready to hire smarter?</h2>
          <p className="mx-auto mt-3 max-w-md text-body-lg text-white/80">
            Join the recruiting teams using HireGen AI to screen faster and hire with confidence.
          </p>
          <Button size="lg" className="mt-7 bg-white text-brand-navy-900 hover:bg-white/90" asChild>
            <Link to="/register">
              Get started free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 text-[12px] text-muted sm:flex-row">
          <span>© 2026 HireGen AI. All rights reserved.</span>
          <span>Smarter Hiring. Better Futures.</span>
        </div>
      </footer>
    </div>
  );
}
