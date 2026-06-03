import { prisma } from "./prisma.js";

export async function incrementAdminTokenVersion(adminId: string): Promise<number> {
  const updated = await prisma.admin.update({
    where: { id: adminId },
    data: { tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });
  return updated.tokenVersion;
}
