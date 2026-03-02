# deploy-github.ps1
# Trigger the GitHub Actions deploy workflow -- pure gh CLI, no external tools.
# Usage:  .\deploy-github.ps1 [all|hosting|functions|cloudrun]
# Requires: gh CLI authenticated  (gh auth login)

param(
    [ValidateSet('all', 'hosting', 'functions', 'cloudrun')]
    [string]$Target = 'all'
)

$ErrorActionPreference = 'Stop'

# -- Verify gh CLI is installed and authenticated
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "gh CLI not found. Install from https://cli.github.com and run 'gh auth login'."
    exit 1
}
gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Not authenticated with gh. Run 'gh auth login' first."
    exit 1
}

# -- Resolve repo via gh (no raw git dependency)
$Repo = gh repo view --json nameWithOwner -q .nameWithOwner 2>$null
if (-not $Repo) {
    Write-Error "Could not resolve GitHub repo. Ensure you are inside a cloned GitHub repository."
    exit 1
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  GitHub Actions Deploy"                          -ForegroundColor Cyan
Write-Host "  Repo   : $Repo"                                -ForegroundColor Cyan
Write-Host "  Target : $Target"                              -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# -- Trigger the workflow
Write-Host "Triggering workflow deploy.yml (target=$Target)..." -ForegroundColor Green
gh workflow run deploy.yml --repo $Repo --field target=$Target

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to trigger workflow. Check that deploy.yml exists on the default branch."
    exit 1
}

Write-Host ""
Write-Host "Workflow triggered -- fetching run ID..." -ForegroundColor Green
Start-Sleep -Seconds 4

# -- Show recent runs
Write-Host ""
Write-Host "Latest runs:" -ForegroundColor Cyan
gh run list --repo $Repo --workflow deploy.yml --limit 3

# -- Stream live logs via gh run watch
$RunId = gh run list --repo $Repo --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId'
if ($RunId) {
    Write-Host ""
    Write-Host "Streaming logs (Ctrl+C to detach)..." -ForegroundColor Green
    gh run watch $RunId --repo $Repo --exit-status
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Workflow run failed. See logs above."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "Could not find run ID -- watch manually:" -ForegroundColor DarkGray
    Write-Host "  gh run watch --repo $Repo" -ForegroundColor DarkGray
}

# -- Open Actions tab in browser via gh browse
Write-Host ""
Write-Host "Opening Actions in browser..." -ForegroundColor DarkGray
gh browse --repo $Repo -- actions
