$env:Path = "C:\Program Files\nodejs;" + $env:Path
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location "$root\frontend"
Write-Host "Starting frontend on http://localhost:3000"
npm run dev
