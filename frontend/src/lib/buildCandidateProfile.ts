import type { ApplicantBackground, ApplicantPersonalInfo, Candidate, FitScoreBreakdown, Job } from "@/types";

export type CandidateSource = "candidate-portal" | "recruiter-added";

export interface BuildCandidateProfileInput {
  job: Job;
  personalInfo: ApplicantPersonalInfo;
  background: ApplicantBackground;
  resumeFileName: string;
  extractedSkills: string[];
  fitScore: FitScoreBreakdown;
  source: CandidateSource;
}

/**
 * Shapes personal info + background + resume + a computed Fit Score into the
 * Candidate record shape the recruiter-facing views expect. Shared by both
 * entry points that create candidates: the candidate self-service application
 * flow (applicationsService.applyToJob) and the recruiter's manual "Add
 * Candidate" intake (AddCandidateDrawer) — so a candidate looks the same to
 * recruiters no matter how they entered the pipeline.
 */
export function buildCandidateProfile(input: BuildCandidateProfileInput): Omit<Candidate, "id" | "avatarColor"> {
  const { job, personalInfo, background, resumeFileName, extractedSkills, fitScore, source } = input;
  const today = new Date().toISOString().slice(0, 10);
  const resolvedSkills = background.skills.length > 0 ? background.skills : extractedSkills;

  const sourceBullet =
    source === "candidate-portal"
      ? `Applied directly through the HireGen AI candidate portal for ${job.title}.`
      : `Added manually by a recruiter for ${job.title}.`;

  const experienceBullet = background.isFresher
    ? `Entry-level candidate (fresher) — no prior professional experience listed.`
    : `${background.yearsExperience} year${background.yearsExperience === 1 ? "" : "s"} of experience${background.previousRole ? `, most recently as ${background.previousRole}` : ""}${background.previousCompany ? ` at ${background.previousCompany}` : ""}.`;

  const links = [
    personalInfo.linkedIn && "LinkedIn",
    personalInfo.github && "GitHub",
    personalInfo.portfolio && "portfolio",
  ].filter(Boolean);

  const summaryBullets = [
    experienceBullet,
    sourceBullet,
    `Fit Score generated automatically from resume and application data (${fitScore.confidence} confidence).`,
  ];
  if (links.length > 0) summaryBullets.push(`${links.join(", ")} link${links.length > 1 ? "s" : ""} provided for additional context.`);
  if (background.coverLetter.trim()) summaryBullets.push("Included a cover letter with their application.");

  return {
    name: personalInfo.fullName,
    email: personalInfo.email,
    location: personalInfo.location,
    appliedJobId: job.id,
    skills: resolvedSkills,
    education: background.college ? `${background.education}, ${background.college}` : background.education,
    employmentHistory: background.previousCompany
      ? [{ company: background.previousCompany, title: background.previousRole || "Not specified", startDate: "Previously", endDate: null }]
      : [],
    certifications: [],
    resumeFileName,
    summaryBullets,
    fitScore,
    authenticity: { status: "authentic", score: 92 },
    riskLevel: "low",
    riskFlags: [],
    languageTag: "en",
    stage: "applied",
    appliedAt: today,
  };
}
