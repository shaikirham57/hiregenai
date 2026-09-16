import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { CandidateAreaLayout } from "@/app/CandidateAreaLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardShell } from "@/components/layout/DashboardShell";

const LandingPage = lazy(() => import("@/features/landing/LandingPage"));
const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/RegisterPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"));
const JobListPage = lazy(() => import("@/features/jobs/JobListPage"));
const JobDetailPage = lazy(() => import("@/features/jobs/JobDetailPage"));
const CandidateListPage = lazy(() => import("@/features/candidates/CandidateListPage"));
const CandidateProfilePage = lazy(() => import("@/features/candidates/CandidateProfilePage"));
const ScreeningPage = lazy(() => import("@/features/screening/ScreeningPage"));
const RankingPage = lazy(() => import("@/features/ranking/RankingPage"));
const AssessmentsPage = lazy(() => import("@/features/assessments/AssessmentsPage"));
const TakeAssessmentPage = lazy(() => import("@/features/assessments/TakeAssessmentPage"));
const InterviewsPage = lazy(() => import("@/features/interviews/InterviewsPage"));
const InterviewResultsPage = lazy(() => import("@/features/interviews/InterviewResultsPage"));
const ApplicationsPage = lazy(() => import("@/features/applications/ApplicationsPage"));
const FindJobsPage = lazy(() => import("@/features/findjobs/FindJobsPage"));
const FindJobDetailPage = lazy(() => import("@/features/findjobs/FindJobDetailPage"));
const ApplyPage = lazy(() => import("@/features/findjobs/ApplyPage"));
const QuickApplyPage = lazy(() => import("@/features/findjobs/QuickApplyPage"));
const ApplicationSuccessPage = lazy(() => import("@/features/findjobs/ApplicationSuccessPage"));
const NotificationsPage = lazy(() => import("@/features/notifications/NotificationsPage"));
const AnalyticsPage = lazy(() => import("@/features/analytics/AnalyticsPage"));
const NotFoundPage = lazy(() => import("@/features/misc/NotFoundPage"));

function RouteFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-canvas">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<CandidateAreaLayout />}>
          <Route path="/find-jobs" element={<FindJobsPage />} />
          <Route path="/find-jobs/:id" element={<FindJobDetailPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assessments/:id/take" element={<TakeAssessmentPage />} />

            <Route element={<ProtectedRoute allowedRole="recruiter" />}>
              <Route path="/jobs" element={<JobListPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/candidates" element={<CandidateListPage />} />
              <Route path="/candidates/:id" element={<CandidateProfilePage />} />
              <Route path="/screening" element={<ScreeningPage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/interviews" element={<InterviewsPage />} />
              <Route path="/interviews/:id/results" element={<InterviewResultsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRole="candidate" />}>
              <Route path="/my-applications" element={<ApplicationsPage />} />
              <Route path="/applications" element={<Navigate to="/my-applications" replace />} />
              <Route path="/find-jobs/:id/apply" element={<ApplyPage />} />
              <Route path="/quick-apply" element={<QuickApplyPage />} />
              <Route path="/application-success" element={<ApplicationSuccessPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
