#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/c/Program Files/nodejs:$PATH"

echo "Node: $(node --version)"
echo "npm: $(npm --version)"

echo "=== Backend ==="
cd "$ROOT/backend"
npm install
npx prisma generate

echo "=== Frontend ==="
cd "$ROOT/frontend"
npm install

echo "=== Done ==="
echo "Run: bash scripts/start-backend.sh"
echo "Run: bash scripts/start-frontend.sh"
