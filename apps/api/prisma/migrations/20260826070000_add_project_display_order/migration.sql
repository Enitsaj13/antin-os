ALTER TABLE "Project" ADD COLUMN "displayOrder" INTEGER;

WITH ordered_projects AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" DESC, "id" ASC) - 1 AS "nextDisplayOrder"
  FROM "Project"
)
UPDATE "Project"
SET "displayOrder" = ordered_projects."nextDisplayOrder"
FROM ordered_projects
WHERE "Project"."id" = ordered_projects."id";

ALTER TABLE "Project" ALTER COLUMN "displayOrder" SET DEFAULT 0;
ALTER TABLE "Project" ALTER COLUMN "displayOrder" SET NOT NULL;

CREATE INDEX "Project_isPublic_displayOrder_createdAt_idx" ON "Project"("isPublic", "displayOrder", "createdAt");
