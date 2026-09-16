export type UserRole = "recruiter" | "candidate";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title?: string;
  avatarColor: string;
}

export type PipelineStage = "applied" | "screened" | "interview" | "offer" | "hired" | "rejected";

export const PIPELINE_STAGES: PipelineStage[] = ["applied", "screened", "interview", "offer", "hired"];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  applied: "Applied",
  screened: "Screened",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export type JobStatus = "draft" | "open" | "paused" | "closed";

export interface ScoringWeights {
  skills: number;
  experience: number;
  education: number;
}

export interface SalaryRange {
  min: number;
  mid: number;
  max: number;
  source: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: "Full-time" | "Part-time" | "Contract";
  seniority: string;
  status: JobStatus;
  description: string;
  responsibilities?: string[];
  qualifications?: string[];
  screeningQuestions?: string[];
  skills: string[];
  scoringWeights: ScoringWeights;
  salaryRange: SalaryRange;
  applicantCount: number;
  openDate: string;
  hiringManager: string;
}

export type RiskLevel = "low" | "medium" | "high";
export type AuthenticityStatus = "authentic" | "suspicious" | "high_risk";

export interface FitScoreBreakdown {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  confidence: "high" | "low";
  matchedSkills: string[];
  missingSkills: string[];
  narrative: string;
}

export interface RiskFlag {
  type: string;
  description: string;
}

export interface EmploymentHistoryEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  location: string;
  appliedJobId: string;
  avatarColor: string;
  skills: string[];
  education: string;
  employmentHistory: EmploymentHistoryEntry[];
  certifications: string[];
  resumeFileName: string;
  summaryBullets: string[];
  fitScore: FitScoreBreakdown;
  authenticity: { status: AuthenticityStatus; score: number };
  riskLevel: RiskLevel;
  riskFlags: RiskFlag[];
  languageTag: string;
  stage: PipelineStage;
  appliedAt: string;
}

export interface ApplicationTimelineEntry {
  stage: PipelineStage;
  date: string;
  note?: string;
}

export interface ApplicantPersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  github: string;
  portfolio: string;
}

export interface ApplicantBackground {
  education: string;
  college: string;
  graduationYear: string;
  isFresher: boolean;
  yearsExperience: number;
  previousCompany: string;
  previousRole: string;
  skills: string[];
  coverLetter: string;
}

export interface ScreeningAnswer {
  question: string;
  answer: string;
}

export interface InterviewDetails {
  interviewerName: string;
  interviewerRole: string;
  interviewerCompany: string;
  scheduledByName: string;
  scheduledByRole: string;
  date: string;
  time: string;
  interviewType: string;
  meetingLink?: string;
  recruiterContactName: string;
  recruiterContactEmail: string;
  recruiterContactPhone?: string;
}

export interface Application {
  id: string;
  candidateId: string;
  candidateProfileId?: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  stage: PipelineStage;
  appliedAt: string;
  updatedAt: string;
  timeline: ApplicationTimelineEntry[];
  personalInfo?: ApplicantPersonalInfo;
  background?: ApplicantBackground;
  screeningAnswers?: ScreeningAnswer[];
  resumeFileName?: string;
  matchScore?: number;
  interviewDetails?: InterviewDetails;
}

export type QuestionType = "mcq" | "behavioral";

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctOptionIndex?: number;
  flagged?: boolean;
}

export interface Assessment {
  id: string;
  jobId: string;
  jobTitle: string;
  title: string;
  status: "draft" | "published";
  questions: AssessmentQuestion[];
  weightInFitScore: number;
  dueDate?: string;
}

export type IntegrityStatus = "clean" | "tab_switch" | "expired_link";

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  candidateId: string;
  candidateName: string;
  mcqScore: number;
  behavioralScore: number;
  integrityStatus: IntegrityStatus;
  completedAt: string;
}

export interface InterviewQuestion {
  id: string;
  type: "technical" | "behavioral";
  prompt: string;
  targetGap?: string;
}

export interface CompetencyScore {
  competency: string;
  score: number;
}

export type InterviewRecommendation = "recommend" | "hold" | "reject";
export type InterviewStatus = "scheduled" | "completed" | "canceled";

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  scheduledAt: string;
  interviewer: string;
  status: InterviewStatus;
  questions: InterviewQuestion[];
  transcriptExcerpt?: string;
  competencyScores?: CompetencyScore[];
  overallScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendation?: InterviewRecommendation;
  justification?: string;
}

export type NotificationType = "status_update" | "interview" | "assessment" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  aiGenerated?: boolean;
}

export interface FunnelStagePoint {
  stage: string;
  count: number;
}

export interface SkillDemandPoint {
  skill: string;
  count: number;
}

export interface TrendPoint {
  month: string;
  value: number;
}

export interface AnalyticsSnapshot {
  timeToHireDays: number;
  timeToHireTrend: number;
  offerAcceptanceRate: number;
  avgFitScore: number;
  resumeAuthenticityRate: number;
  openJobs: number;
  totalApplicants: number;
  interviewsScheduled: number;
  funnel: FunnelStagePoint[];
  topSkills: SkillDemandPoint[];
  hiresByMonth: TrendPoint[];
}

export type ResumeParseStage = "uploading" | "extracting" | "vectorizing" | "done" | "error";

export interface ResumeUploadJob {
  id: string;
  fileName: string;
  stage: ResumeParseStage;
  progress: number;
  errorMessage?: string;
  extractedSkills?: string[];
  extractedExperienceYears?: number;
  extractedEducation?: string;
  fileSize?: number;
  candidateName?: string;
  matchScore?: number;
  matchedSkills?: string[];
  jobId?: string;
}
