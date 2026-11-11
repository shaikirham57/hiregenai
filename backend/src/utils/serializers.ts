import type {
  Application,
  Assessment,
  AssessmentResult,
  Candidate,
  Interview,
  Job,
  Notification,
  User,
} from "@prisma/client";

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  Full_time: "Full-time",
  Part_time: "Part-time",
  Contract: "Contract",
};

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title ?? undefined,
    avatarColor: user.avatarColor,
  };
}

export function serializeJob(job: Job) {
  return {
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    employmentType: EMPLOYMENT_TYPE_MAP[job.employmentType] ?? job.employmentType,
    seniority: job.seniority,
    status: job.status,
    description: job.description,
    responsibilities: job.responsibilities,
    qualifications: job.qualifications,
    screeningQuestions: job.screeningQuestions,
    skills: job.skills,
    scoringWeights: job.scoringWeights,
    salaryRange: job.salaryRange,
    applicantCount: job.applicantCount,
    openDate: dateOnly(job.openDate),
    hiringManager: job.hiringManager,
  };
}

export function serializeCandidate(candidate: Candidate) {
  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    location: candidate.location,
    appliedJobId: candidate.appliedJobId,
    avatarColor: candidate.avatarColor,
    skills: candidate.skills,
    education: candidate.education,
    employmentHistory: candidate.employmentHistory,
    certifications: candidate.certifications,
    resumeFileName: candidate.resumeFileName,
    resumeFileId: candidate.resumeFileId ?? undefined,
    screening: candidate.screening ?? undefined,
    summaryBullets: candidate.summaryBullets,
    fitScore: candidate.fitScore,
    authenticity: { status: candidate.authenticityStatus, score: candidate.authenticityScore },
    riskLevel: candidate.riskLevel,
    riskFlags: candidate.riskFlags,
    languageTag: candidate.languageTag,
    stage: candidate.stage,
    appliedAt: dateOnly(candidate.appliedAt),
  };
}

export function serializeApplication(app: Application) {
  return {
    id: app.id,
    candidateId: app.candidateId,
    candidateProfileId: app.candidateProfileId ?? undefined,
    jobId: app.jobId,
    jobTitle: app.jobTitle,
    company: app.company,
    location: app.location,
    stage: app.stage,
    appliedAt: dateOnly(app.appliedAt),
    updatedAt: dateOnly(app.updatedAt),
    timeline: app.timeline,
    personalInfo: app.personalInfo ?? undefined,
    background: app.background ?? undefined,
    screeningAnswers: app.screeningAnswers ?? undefined,
    resumeFileName: app.resumeFileName ?? undefined,
    resumeFileId: app.resumeFileId ?? undefined,
    matchScore: app.matchScore ?? undefined,
    interviewDetails: app.interviewDetails ?? undefined,
  };
}

export function serializeAssessment(a: Assessment) {
  return {
    id: a.id,
    jobId: a.jobId,
    jobTitle: a.jobTitle,
    title: a.title,
    status: a.status,
    questions: a.questions,
    weightInFitScore: a.weightInFitScore,
    dueDate: a.dueDate ? dateOnly(a.dueDate) : undefined,
  };
}

export function serializeAssessmentResult(r: AssessmentResult) {
  return {
    id: r.id,
    assessmentId: r.assessmentId,
    candidateId: r.candidateId,
    candidateName: r.candidateName,
    mcqScore: r.mcqScore,
    behavioralScore: r.behavioralScore,
    integrityStatus: r.integrityStatus,
    completedAt: dateOnly(r.completedAt),
  };
}

export function serializeInterview(i: Interview) {
  return {
    id: i.id,
    candidateId: i.candidateId,
    candidateName: i.candidateName,
    jobId: i.jobId,
    jobTitle: i.jobTitle,
    scheduledAt: i.scheduledAt.toISOString(),
    interviewer: i.interviewer,
    status: i.status,
    questions: i.questions,
    transcriptExcerpt: i.transcriptExcerpt ?? undefined,
    competencyScores: i.competencyScores ?? undefined,
    overallScore: i.overallScore ?? undefined,
    strengths: i.strengths ?? undefined,
    weaknesses: i.weaknesses ?? undefined,
    recommendation: i.recommendation ?? undefined,
    justification: i.justification ?? undefined,
  };
}

export function serializeNotification(n: Notification) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt.toISOString(),
    read: n.read,
    aiGenerated: n.aiGenerated,
  };
}

export type { Job as PrismaJob, Candidate as PrismaCandidate };
export type PublicUser = ReturnType<typeof serializeUser>;
export type PublicJob = ReturnType<typeof serializeJob>;
export type PublicCandidate = ReturnType<typeof serializeCandidate>;
export type PublicApplication = ReturnType<typeof serializeApplication>;
