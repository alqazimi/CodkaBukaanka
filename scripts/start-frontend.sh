#!/usr/bin/env bash
export PATH="/c/Program Files/nodejs:$PATH"
cd "$(dirname "$0")/../frontend"
echo "Starting frontend on http://localhost:3000"
npm run dev
