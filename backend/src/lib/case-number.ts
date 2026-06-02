import { prisma } from "./prisma.js";

export async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DB-${year}-`;

  const latest = await prisma.case.findFirst({
    where: { caseNumber: { startsWith: prefix } },
    orderBy: { caseNumber: "desc" },
    select: { caseNumber: true },
  });

  let next = 1;
  if (latest) {
    const seq = parseInt(latest.caseNumber.slice(prefix.length), 10);
    if (!Number.isNaN(seq)) next = seq + 1;
  }

  return `${prefix}${String(next).padStart(3, "0")}`;
}
