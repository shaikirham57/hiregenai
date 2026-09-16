import { useAuth } from "@/hooks/useAuth";
import { RecruiterDashboard } from "@/features/dashboard/RecruiterDashboard";
import { CandidateDashboard } from "@/features/dashboard/CandidateDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "recruiter" ? <RecruiterDashboard /> : <CandidateDashboard />;
}
