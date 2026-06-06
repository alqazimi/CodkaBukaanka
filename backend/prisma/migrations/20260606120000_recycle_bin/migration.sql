-- Soft-delete columns for recycle bin
ALTER TABLE "Hospital" ADD COLUMN "deletedAt" TIMESTAMP(3), ADD COLUMN "deletedById" TEXT;
ALTER TABLE "Patient" ADD COLUMN "deletedAt" TIMESTAMP(3), ADD COLUMN "deletedById" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "deletedAt" TIMESTAMP(3), ADD COLUMN "deletedById" TEXT;
ALTER TABLE "Medication" ADD COLUMN "deletedAt" TIMESTAMP(3), ADD COLUMN "deletedById" TEXT;
ALTER TABLE "Case" ADD COLUMN "deletedAt" TIMESTAMP(3), ADD COLUMN "deletedById" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "deletedAt" TIMESTAMP(3), ADD COLUMN "deletedById" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN "deletedAt" TIMESTAMP(3), ADD COLUMN "deletedById" TEXT;

CREATE INDEX "Hospital_deletedAt_idx" ON "Hospital"("deletedAt");
CREATE INDEX "Patient_deletedAt_idx" ON "Patient"("deletedAt");
CREATE INDEX "Doctor_deletedAt_idx" ON "Doctor"("deletedAt");
CREATE INDEX "Medication_deletedAt_idx" ON "Medication"("deletedAt");
CREATE INDEX "Case_deletedAt_idx" ON "Case"("deletedAt");
CREATE INDEX "Evidence_deletedAt_idx" ON "Evidence"("deletedAt");
CREATE INDEX "ContactMessage_deletedAt_idx" ON "ContactMessage"("deletedAt");
