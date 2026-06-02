$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\nodejs;" + $env:Path
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Installing backend dependencies..."
Set-Location "$root\backend"
npm install
npx prisma generate

Write-Host "Installing frontend dependencies..."
Set-Location "$root\frontend"
npm install

Write-Host "Done. Run scripts/start-backend.ps1 and scripts/start-frontend.ps1"
