#!/usr/bin/env bash
# Run both apps — works without PATH setup: bash dev.sh
export PATH="/c/Program Files/nodejs:$PATH"
cd "$(dirname "$0")"
npm.cmd run dev
