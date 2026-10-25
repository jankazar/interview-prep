# Pushes this local repo to GitHub.
# Prerequisite: create an EMPTY public repo at https://github.com/new
# (no README / .gitignore / license).
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\push-to-github.ps1
param(
    [string]$Owner = "jankazar",
    [string]$Repo = "interview-prep",
    [string]$Branch = "main"
)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$url = "https://github.com/$Owner/$Repo.git"

# Rename current branch (master -> main) if needed
$current = git branch --show-current
if ($current -ne $Branch) { git branch -m $current $Branch }

# Add or update origin
if (git remote | Select-String -Quiet "^origin$") {
    git remote set-url origin $url
} else {
    git remote add origin $url
}

# First push, set upstream
git push -u origin $Branch
if ($LASTEXITCODE -ne 0) { throw "git push failed (exit code $LASTEXITCODE)" }

git remote -v
git status -sb
