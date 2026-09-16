import { Link, Outlet } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const PROOF_POINTS = [
  "Up to 97% less manual shortlisting effort",
  "38% better candidate-job relevance via semantic matching",
  "30–45% higher interview-to-offer conversion",
  "100% explainable AI scoring — every decision, audit-ready",
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-brand p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_45%)]" />
        <Link to="/" className="relative z-10">
          <Logo onDark />
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-h1 font-bold leading-tight">Smarter Hiring. Better Futures.</h2>
          <p className="mt-3 text-body-lg text-white/80">
            HireGen AI helps recruiting teams screen, score, and hire with explainable AI at every step.
          </p>
          <ul className="mt-8 space-y-3">
            {PROOF_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-[14px] text-white/90">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-lilac-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-[12px] text-white/50">© 2026 HireGen AI. All rights reserved.</p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <Link to="/" className="mb-8 lg:hidden">
          <Logo />
        </Link>
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
