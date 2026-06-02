import { prisma } from "./prisma.js";
import type { AuditAction } from "@prisma/client";

export async function logAudit(params: {
  adminId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
