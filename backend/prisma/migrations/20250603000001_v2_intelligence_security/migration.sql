-- V2: Intelligence platform + security hardening

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "EvidenceVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'LOGIN_FAILED';

-- AlterTable Admin
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "totpSecret" TEXT;
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "Admin_email_idx" ON "Admin"("email");

-- AlterTable Case: add riskLevel (required)
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "riskLevel" "RiskLevel";
UPDATE "Case" SET "riskLevel" = 'MEDIUM' WHERE "riskLevel" IS NULL;
ALTER TABLE "Case" ALTER COLUMN "riskLevel" SET NOT NULL;
ALTER TABLE "Case" ALTER COLUMN "riskLevel" SET DEFAULT 'MEDIUM';

-- Composite indexes for analytics + search
CREATE INDEX IF NOT EXISTS "Case_status_riskLevel_idx" ON "Case"("status", "riskLevel");
CREATE INDEX IF NOT EXISTS "Case_status_category_idx" ON "Case"("status", "category");
CREATE INDEX IF NOT EXISTS "Case_status_hospitalId_idx" ON "Case"("status", "hospitalId");

-- AlterTable Evidence
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "visibility" "EvidenceVisibility" NOT NULL DEFAULT 'PUBLIC';
CREATE INDEX IF NOT EXISTS "Evidence_visibility_idx" ON "Evidence"("visibility");
