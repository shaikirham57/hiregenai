import { Outlet } from "react-router-dom";
import { PublicHeader } from "@/components/layout/PublicHeader";

/**
 * Layout for the anonymous, no-login job board (/find-jobs, /find-jobs/:id).
 * Used only when there is no logged-in user — see CandidateAreaLayout, which
 * renders the authenticated DashboardShell instead once a candidate signs in.
 */
export function PublicJobsLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <PublicHeader />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
