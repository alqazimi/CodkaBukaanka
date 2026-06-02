$env:Path = "C:\Program Files\nodejs;" + $env:Path
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location "$root\backend"
Write-Host "Starting backend on http://localhost:4000"
npm run dev
