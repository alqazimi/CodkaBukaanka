import "dotenv/config";
import pg from "pg";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, "..");

const adminUrl =
  process.env.POSTGRES_ADMIN_URL ??
  (process.env.POSTGRES_PASSWORD
    ? `postgresql://postgres:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@localhost:5432/postgres`
    : null);

if (!adminUrl) {
  console.error(`
Add your local PostgreSQL password to backend/.env:

  POSTGRES_PASSWORD="your-postgres-password"

Then run:  npm run setup
`);
  process.exit(1);
}

const appUser = "app_user";
const appPassword = process.env.APP_USER_PASSWORD ?? "StrongPassword123!";
const dbName = "diiwaanka_bukaanka";

async function run() {
  console.log("Connecting as PostgreSQL superuser...");
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();

  const dbExists = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
  if (!dbExists.rowCount) {
    console.log(`Creating database ${dbName}...`);
    await client.query(`CREATE DATABASE ${dbName}`);
  }

  const userExists = await client.query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [appUser]);
  if (!userExists.rowCount) {
    console.log(`Creating user ${appUser}...`);
    await client.query(`CREATE USER ${appUser} WITH PASSWORD '${appPassword.replace(/'/g, "''")}'`);
  }

  await client.end();

  const dbClient = new pg.Client({
    connectionString: adminUrl.replace(/\/postgres(\?|$)/, `/${dbName}$1`),
  });
  await dbClient.connect();

  console.log("Granting permissions...");
  await dbClient.query(`
    GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${appUser};
    GRANT ALL ON SCHEMA public TO ${appUser};
    GRANT CREATE ON SCHEMA public TO ${appUser};
    ALTER SCHEMA public OWNER TO ${appUser};
    ALTER DATABASE ${dbName} OWNER TO ${appUser};
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${appUser};
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${appUser};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${appUser};
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${appUser};
  `);
  await dbClient.end();

  console.log("Running migrations...");
  execSync("npx prisma migrate deploy", { cwd: backendRoot, stdio: "inherit" });

  console.log("Seeding...");
  execSync("npx tsx prisma/seed.ts", { cwd: backendRoot, stdio: "inherit" });

  console.log("\nSetup complete. Run: npm run dev");
}

run().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
