-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "resumeFileId" TEXT;

-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "resumeFileId" TEXT,
ADD COLUMN     "screening" JSONB;

-- CreateTable
CREATE TABLE "resume_files" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "text" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_files_uploadedById_idx" ON "resume_files"("uploadedById");

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_resumeFileId_fkey" FOREIGN KEY ("resumeFileId") REFERENCES "resume_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_resumeFileId_fkey" FOREIGN KEY ("resumeFileId") REFERENCES "resume_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_files" ADD CONSTRAINT "resume_files_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

