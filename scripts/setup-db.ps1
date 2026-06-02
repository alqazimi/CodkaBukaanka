param(
  [Parameter(Mandatory = $true)]
  [string]$PostgresPassword
)

$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\nodejs;" + $env:Path
$env:PGPASSWORD = $PostgresPassword
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not (Test-Path $psql)) {
  Write-Error "psql not found at $psql. Adjust path in this script if PostgreSQL is installed elsewhere."
}

Write-Host "Granting permissions to app_user..."
& $psql -U postgres -h localhost -d diiwaanka_bukaanka -v ON_ERROR_STOP=1 -c @"
GRANT ALL ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;
ALTER SCHEMA public OWNER TO app_user;
ALTER DATABASE diiwaanka_bukaanka OWNER TO app_user;
"@

Write-Host "Running migrations..."
Set-Location "$root\backend"
npx prisma migrate deploy

Write-Host "Seeding..."
npm run db:seed

Write-Host "Done. Restart backend: npm run dev"
