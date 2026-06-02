-- Admin authentication hardening fields
ALTER TABLE "Admin"
ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT,
ADD COLUMN IF NOT EXISTS "lastLoginUserAgent" TEXT,
ADD COLUMN IF NOT EXISTS "lastLoginRiskFlagged" BOOLEAN NOT NULL DEFAULT false;
