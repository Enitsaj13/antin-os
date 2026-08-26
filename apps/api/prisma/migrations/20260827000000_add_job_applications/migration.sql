-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "jobUrl" TEXT,
    "source" TEXT,
    "salaryRange" TEXT,
    "notes" TEXT,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'SAVED',
    "applicationDate" TIMESTAMP(3),
    "interviewDate" TIMESTAMP(3),
    "nextActionDate" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobApplication_status_updatedAt_idx" ON "JobApplication"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "JobApplication_applicationDate_idx" ON "JobApplication"("applicationDate");

-- CreateIndex
CREATE INDEX "JobApplication_interviewDate_idx" ON "JobApplication"("interviewDate");

-- CreateIndex
CREATE INDEX "JobApplication_nextActionDate_idx" ON "JobApplication"("nextActionDate");
