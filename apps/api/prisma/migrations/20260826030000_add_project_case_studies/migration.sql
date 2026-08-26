CREATE TABLE "ProjectCaseStudy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "responsibilities" TEXT[],
    "technicalChallenges" TEXT[],
    "outcomes" TEXT[],
    "lessonsLearned" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCaseStudy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectCaseStudy_projectId_key" ON "ProjectCaseStudy"("projectId");
CREATE INDEX "ProjectCaseStudy_isPublic_idx" ON "ProjectCaseStudy"("isPublic");

ALTER TABLE "ProjectCaseStudy" ADD CONSTRAINT "ProjectCaseStudy_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
