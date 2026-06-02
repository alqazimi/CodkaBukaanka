#!/usr/bin/env bash
# One-time setup: Git Bash + Node.js on Windows
NODE_PATH='export PATH="/c/Program Files/nodejs:$PATH"'
ALIASES='alias npm="npm.cmd"
alias npx="npx.cmd"'

setup_file() {
  local file="$1"
  if [ -f "$file" ] && grep -q 'Program Files/nodejs' "$file" 2>/dev/null; then
    echo "Already configured: $file"
    return
  fi
  echo "" >> "$file"
  echo "# Node.js (Diiwaanka Bukaanka)" >> "$file"
  echo "$NODE_PATH" >> "$file"
  echo "$ALIASES" >> "$file"
  echo "Updated: $file"
}

touch "$HOME/.bashrc"
setup_file "$HOME/.bashrc"

# Git Bash login shells read .bash_profile, not .bashrc
PROFILE="$HOME/.bash_profile"
if [ ! -f "$PROFILE" ] || ! grep -q 'source.*bashrc' "$PROFILE" 2>/dev/null; then
  touch "$PROFILE"
  echo "" >> "$PROFILE"
  echo "# Load .bashrc (Diiwaanka Bukaanka)" >> "$PROFILE"
  echo 'if [ -f "$HOME/.bashrc" ]; then source "$HOME/.bashrc"; fi' >> "$PROFILE"
  echo "Updated: $PROFILE (sources .bashrc)"
fi

export PATH="/c/Program Files/nodejs:$PATH"
alias npm='npm.cmd' 2>/dev/null || true
alias npx='npx.cmd' 2>/dev/null || true

echo ""
echo "Done! In THIS terminal, run:"
echo "  source ~/.bashrc"
echo "  npm run dev"
echo ""
echo "New Git Bash windows will work automatically."
