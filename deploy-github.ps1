# deploy-github.ps1
# Trigger the GitHub Actions deploy workflow via the gh CLI.
# Usage:  .\deploy-github.ps1 [all|hosting|functions|cloudrun]
# Requires: gh CLI authenticated  (gh auth login)

param(
    [ValidateSet('all', 'hosting', 'functions', 'cloudrun')]
    [string]$Target = 'all'
)

$ErrorActionPreference = 'Stop'

# ── Resolve repo from git remote ─────────────────────────────
$RemoteUrl = git remote get-url origin 2>$null
if (-not $RemoteUrl) {
    Write-Error "No git remote 'origin' found. Is this a git repo?"
    exit 1
}
# Normalise SSH → OWNER/REPO  (handles both https and git@ formats)
$Repo = $RemoteUrl -replace '.*github\.com[:/]', '' -replace '\.git$', ''

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  GitHub Actions Deploy" -ForegroundColor Cyan
Write-Host "  Repo   : $Repo" -ForegroundColor Cyan
Write-Host "  Target : $Target" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# ── Check gh is installed & authenticated ────────────────────
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "gh CLI not found. Install from https://cli.github.com and run 'gh auth login'."
    exit 1
}
gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Not authenticated with gh. Run 'gh auth login' first."
    exit 1
}

# ── Trigger the workflow ──────────────────────────────────────
Write-Host "Triggering workflow deploy.yml (target=$Target)..." -ForegroundColor Green
gh workflow run deploy.yml --repo $Repo --field target=$Target

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to trigger workflow. Check that deploy.yml exists on the default branch."
    exit 1
}

Write-Host ""
Write-Host "Workflow triggered! Waiting for it to appear..." -ForegroundColor Green
Start-Sleep -Seconds 3

# ── Tail the latest run ──────────────────────────────────────
Write-Host ""
Write-Host "Latest runs:" -ForegroundColor Cyan
gh run list --repo $Repo --workflow deploy.yml --limit 3

Write-Host ""
Write-Host "Watch live logs with:" -ForegroundColor DarkGray
Write-Host "  gh run watch --repo $Repo" -ForegroundColor DarkGray
Write-Host ""
$RunsUrl = "https://github.com/$Repo/actions/workflows/deploy.yml"
Write-Host "Open in browser: $RunsUrl" -ForegroundColor DarkGray
Start-Process $RunsUrl
