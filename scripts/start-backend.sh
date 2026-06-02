#!/usr/bin/env bash
export PATH="/c/Program Files/nodejs:$PATH"
cd "$(dirname "$0")/../backend"
echo "Starting backend on http://localhost:4000"
npm run dev
