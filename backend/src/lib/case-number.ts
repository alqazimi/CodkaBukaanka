import { prisma } from "./prisma.js";

export async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DB-${year}-`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const caseNumber = await prisma.$transaction(async (tx) => {
      const latest = await tx.case.findFirst({
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
    });

    const existing = await prisma.case.findUnique({ where: { caseNumber }, select: { id: true } });
    if (!existing) return caseNumber;
  }

  throw new Error("Failed to generate unique case number");
}
