import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  const schema = await prisma.$queryRaw<{ has_create: boolean }[]>`
    SELECT has_schema_privilege(current_user, 'public', 'CREATE') AS has_create
    FROM pg_namespace WHERE nspname = 'public'
  `;
  if (!schema[0]?.has_create) {
    console.error("No CREATE permission on public schema — run: npm run setup");
    process.exit(1);
  }
}

main()
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
