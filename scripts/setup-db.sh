#!/usr/bin/env bash
# One-time database fix for "Archive data temporarily unavailable"
set -e
export PATH="/c/Program Files/nodejs:$PATH"
PSQL="/c/Program Files/PostgreSQL/18/bin/psql.exe"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Enter your PostgreSQL superuser (postgres) password:"
read -rs PGPASSWORD
export PGPASSWORD
echo

echo "Granting permissions to app_user..."
"$PSQL" -U postgres -h localhost -d diiwaanka_bukaanka -v ON_ERROR_STOP=1 <<'SQL'
GRANT ALL ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;
ALTER SCHEMA public OWNER TO app_user;
ALTER DATABASE diiwaanka_bukaanka OWNER TO app_user;
SQL

echo "Running migrations..."
cd "$ROOT/backend"
npx prisma migrate deploy

echo "Seeding sample data..."
npm run db:seed

echo ""
echo "Done! Start backend:  cd backend && npm run dev"
echo "Start frontend:       cd frontend && npm run dev"
echo "Open: http://localhost:3000/en"
