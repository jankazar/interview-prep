#!/usr/bin/env bash
# Pushes this local repo to GitHub.
# Prerequisite: create an EMPTY public repo at https://github.com/new
# (no README / .gitignore / license).
# Usage: ./scripts/push-to-github.sh [owner] [repo] [branch]
set -euo pipefail

OWNER="${1:-jankazar}"
REPO="${2:-interview-prep}"
BRANCH="${3:-main}"

cd "$(dirname "$0")/.."

URL="https://github.com/$OWNER/$REPO.git"

# Rename current branch (master -> main) if needed
CURRENT="$(git branch --show-current)"
if [ "$CURRENT" != "$BRANCH" ]; then
    git branch -m "$CURRENT" "$BRANCH"
fi

# Add or update origin
if git remote | grep -qx origin; then
    git remote set-url origin "$URL"
else
    git remote add origin "$URL"
fi

# First push, set upstream
git push -u origin "$BRANCH"

git remote -v
git status -sb
