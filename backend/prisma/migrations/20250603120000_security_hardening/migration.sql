-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Drop redundant index if exists (unique on email already indexes it)
DROP INDEX IF EXISTS "Admin_email_idx";

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_subject_idx" ON "ContactMessage"("subject");
