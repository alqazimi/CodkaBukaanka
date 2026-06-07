-- Speed up admin list, inbox, evidence, and audit queries
CREATE INDEX IF NOT EXISTS "Case_deletedAt_updatedAt_idx" ON "Case"("deletedAt", "updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "Evidence_caseId_visibility_deletedAt_idx" ON "Evidence"("caseId", "visibility", "deletedAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_status_deletedAt_idx" ON "ContactMessage"("status", "deletedAt");
CREATE INDEX IF NOT EXISTS "AuditLog_adminId_createdAt_idx" ON "AuditLog"("adminId", "createdAt" DESC);
