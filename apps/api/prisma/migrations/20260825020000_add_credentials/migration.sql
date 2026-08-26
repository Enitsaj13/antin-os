CREATE TABLE "PortfolioSettings" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'owner',
    "showEducation" BOOLEAN NOT NULL DEFAULT false,
    "showCertifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "credential" TEXT NOT NULL,
    "fieldOfStudy" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "summary" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "summary" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PortfolioSettings_singletonKey_key" ON "PortfolioSettings"("singletonKey");
CREATE INDEX "Education_isPublic_displayOrder_startDate_idx" ON "Education"("isPublic", "displayOrder", "startDate");
CREATE INDEX "Certification_isPublic_displayOrder_issueDate_idx" ON "Certification"("isPublic", "displayOrder", "issueDate");
