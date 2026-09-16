-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('recruiter', 'candidate');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('draft', 'open', 'paused', 'closed');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('Full-time', 'Part-time', 'Contract');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('applied', 'screened', 'interview', 'offer', 'hired', 'rejected');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "AuthenticityStatus" AS ENUM ('authentic', 'suspicious', 'high_risk');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "IntegrityStatus" AS ENUM ('clean', 'tab_switch', 'expired_link');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'completed', 'canceled');

-- CreateEnum
CREATE TYPE "InterviewRecommendation" AS ENUM ('recommend', 'hold', 'reject');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('status_update', 'interview', 'assessment', 'system');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "title" TEXT,
    "avatarColor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL,
    "seniority" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'draft',
    "description" TEXT NOT NULL,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "screeningQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scoringWeights" JSONB NOT NULL,
    "salaryRange" JSONB NOT NULL,
    "applicantCount" INTEGER NOT NULL DEFAULT 0,
    "openDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hiringManager" TEXT NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "appliedJobId" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "education" TEXT NOT NULL,
    "employmentHistory" JSONB NOT NULL DEFAULT '[]',
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resumeFileName" TEXT NOT NULL,
    "summaryBullets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fitScore" JSONB NOT NULL,
    "authenticityStatus" "AuthenticityStatus" NOT NULL,
    "authenticityScore" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "riskFlags" JSONB NOT NULL DEFAULT '[]',
    "languageTag" TEXT NOT NULL,
    "stage" "PipelineStage" NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "candidateProfileId" TEXT,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "stage" "PipelineStage" NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "personalInfo" JSONB,
    "background" JSONB,
    "screeningAnswers" JSONB,
    "resumeFileName" TEXT,
    "matchScore" DOUBLE PRECISION,
    "interviewDetails" JSONB,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'draft',
    "questions" JSONB NOT NULL,
    "weightInFitScore" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "mcqScore" INTEGER NOT NULL,
    "behavioralScore" INTEGER NOT NULL,
    "integrityStatus" "IntegrityStatus" NOT NULL DEFAULT 'clean',
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "interviewer" TEXT NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "questions" JSONB NOT NULL,
    "transcriptExcerpt" TEXT,
    "competencyScores" JSONB,
    "overallScore" INTEGER,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "recommendation" "InterviewRecommendation",
    "justification" TEXT,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_appliedJobId_fkey" FOREIGN KEY ("appliedJobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
