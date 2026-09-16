import { DashboardShell } from "@/components/layout/DashboardShell";
import { PublicJobsLayout } from "@/components/layout/PublicJobsLayout";
import { useAuth } from "@/hooks/useAuth";

/**
 * The job board (/find-jobs, /find-jobs/:id) is reachable by anyone, logged
 * in or not — it's the public entry point candidates need to actually find
 * and view roles before creating an account. Logged-in users get the normal
 * authenticated shell (sidebar/topbar); anonymous visitors get a simple
 * public header instead. Applying still requires an account — see the
 * "Apply now" handling in FindJobDetailPage.
 */
export function CandidateAreaLayout() {
  const { user } = useAuth();
  return user ? <DashboardShell /> : <PublicJobsLayout />;
}
