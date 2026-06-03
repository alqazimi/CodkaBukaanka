-- Admin workflow upgrade: inbox status, case internal notes, admin active flag

CREATE TYPE "InboxStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');

ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;

ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "status" "InboxStatus" NOT NULL DEFAULT 'NEW';
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "readById" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "internalNote" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "linkedCaseId" TEXT;

CREATE INDEX IF NOT EXISTS "ContactMessage_status_idx" ON "ContactMessage"("status");

ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_readById_fkey"
  FOREIGN KEY ("readById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_linkedCaseId_fkey"
  FOREIGN KEY ("linkedCaseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
