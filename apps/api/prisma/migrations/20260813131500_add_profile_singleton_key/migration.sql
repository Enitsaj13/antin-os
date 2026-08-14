-- Add singleton guard to prevent multiple owner profiles.
ALTER TABLE "Profile" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Profile" ADD COLUMN "singletonKey" TEXT NOT NULL DEFAULT 'owner';
CREATE UNIQUE INDEX "Profile_singletonKey_key" ON "Profile"("singletonKey");
