import { useAuth } from "@/hooks/useAuth";
import { RecruiterAssessments } from "@/features/assessments/RecruiterAssessments";
import { CandidateAssessments } from "@/features/assessments/CandidateAssessments";

export default function AssessmentsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "recruiter" ? <RecruiterAssessments /> : <CandidateAssessments />;
}
