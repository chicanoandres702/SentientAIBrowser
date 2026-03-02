# deploy-github.ps1
# Full deploy script: pre-flight → git push → GitHub Actions → live status → Cloud Run URL
#
# Usage:
#   .\deploy-github.ps1                        # deploy all (firestore rules + cloudrun)
#   .\deploy-github.ps1 -Target cloudrun       # Cloud Run only
#   .\deploy-github.ps1 -Target functions      # Firestore rules only
#   .\deploy-github.ps1 -Target hosting        # GitHub Pages only
#   .\deploy-github.ps1 -NoPush                # skip git commit/push (use current HEAD)
#   .\deploy-github.ps1 -Watch:$false          # trigger and exit, don't tail logs
#
# Requires: gh CLI authenticated (gh auth login)

param(
    [ValidateSet('all', 'hosting', 'functions', 'cloudrun')]
    [string]$Target = 'all',
    [switch]$NoPush,
    [bool]$Watch = $true
)

$ErrorActionPreference = 'Stop'
$CLOUD_RUN_SERVICE = 'sentient-proxy'
$CLOUD_RUN_REGION  = 'us-central1'

# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red }
function Write-Info  { param($msg) Write-Host "  · $msg" -ForegroundColor DarkGray }

# ──────────────────────────────────────────────────────────
# 1. PRE-FLIGHT
# ──────────────────────────────────────────────────────────
Write-Step "Pre-flight checks"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Fail "gh CLI not found. Install: https://cli.github.com"
    exit 1
}
gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Fail "gh not authenticated. Run: gh auth login"; exit 1 }
Write-Ok "gh CLI authenticated"

$Repo   = gh repo view --json nameWithOwner -q .nameWithOwner 2>$null
$Branch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $Repo)   { Write-Fail "Not inside a GitHub repo."; exit 1 }
if (-not $Branch) { Write-Fail "Not inside a git repo."; exit 1 }
Write-Ok "Repo  : $Repo"
Write-Ok "Branch: $Branch"
Write-Ok "Target: $Target"

# Warn if gcloud is available and not authed (non-blocking — CI uses service account)
if (Get-Command gcloud -ErrorAction SilentlyContinue) {
    $GcloudAccount = gcloud config get-value account 2>$null
    if ($GcloudAccount) { Write-Ok "gcloud account: $GcloudAccount" }
    else { Write-Warn "gcloud not authenticated locally (CI uses FIREBASE_SERVICE_ACCOUNT secret — OK)" }
}

# ──────────────────────────────────────────────────────────
# 2. GIT COMMIT + PUSH
# ──────────────────────────────────────────────────────────
if (-not $NoPush) {
    Write-Step "Git — commit & push"

    $Staged    = git diff --cached --name-only 2>$null
    $Unstaged  = git diff --name-only 2>$null
    $Untracked = git ls-files --others --exclude-standard 2>$null

    $HasChanges = ($Staged -or $Unstaged -or $Untracked)
    if ($HasChanges) {
        git add -A
        $Stamp   = Get-Date -Format 'yyyy-MM-dd HH:mm'
        $Message = "chore: deploy snapshot [$Target] $Stamp"
        git commit -m $Message
        Write-Ok "Committed: $Message"
    } else {
        Write-Info "Nothing to commit — pushing current HEAD"
    }

    git push origin $Branch
    if ($LASTEXITCODE -ne 0) { Write-Fail "git push failed"; exit 1 }
    Write-Ok "Pushed to $Branch"
} else {
    Write-Info "-NoPush: skipping git commit/push"
}

# ──────────────────────────────────────────────────────────
# 3. TRIGGER GITHUB ACTIONS
# ──────────────────────────────────────────────────────────
Write-Step "Triggering GitHub Actions  (target=$Target)"

gh workflow run deploy.yml --repo $Repo --ref $Branch --field target=$Target
if ($LASTEXITCODE -ne 0) { Write-Fail "Could not trigger workflow (does deploy.yml exist on $Branch?)"; exit 1 }

# Give the API a moment to register the run
Start-Sleep -Seconds 5

$RunId  = gh run list --repo $Repo --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId'
$RunUrl = "https://github.com/$Repo/actions/runs/$RunId"
Write-Ok "Run ID : $RunId"
Write-Ok "URL    : $RunUrl"

# ──────────────────────────────────────────────────────────
# 4. LIVE STATUS  (Ctrl+C to detach at any time)
# ──────────────────────────────────────────────────────────
if ($Watch -and $RunId) {
    Write-Step "Waiting for jobs to complete  (Ctrl+C to detach)"
    Write-Info "Following: $RunUrl"
    Write-Host ""

    gh run watch $RunId --repo $Repo --exit-status
    $ExitCode = $LASTEXITCODE

    # ── Per-job summary ─────────────────────────────────
    Write-Host ""
    Write-Step "Job results"
    $Jobs = gh run view $RunId --repo $Repo --json jobs -q '.jobs[] | "\(.conclusion // "running") \(.name)"' 2>$null
    foreach ($j in $Jobs) {
        $parts     = $j -split ' ', 2
        $status    = $parts[0]
        $jobName   = if ($parts.Count -gt 1) { $parts[1] } else { $j }
        switch ($status) {
            'success'  { Write-Ok   "$jobName" }
            'skipped'  { Write-Info "SKIPPED  $jobName" }
            'failure'  { Write-Fail "$jobName" }
            default    { Write-Warn "$status  $jobName" }
        }
    }

    if ($ExitCode -ne 0) {
        Write-Host ""
        Write-Fail "One or more jobs failed."
        Write-Info "View logs: gh run view $RunId --repo $Repo --log-failed"
        exit $ExitCode
    }
} else {
    Write-Info "-Watch:`$false — not tailing logs."
    Write-Info "Monitor: gh run watch $RunId --repo $Repo"
}

# ──────────────────────────────────────────────────────────
# 5. POST-DEPLOY — print live Cloud Run URL
# ──────────────────────────────────────────────────────────
if ($Target -in 'all','cloudrun') {
    Write-Step "Cloud Run service URL"
    if (Get-Command gcloud -ErrorAction SilentlyContinue) {
        $ServiceUrl = gcloud run services describe $CLOUD_RUN_SERVICE `
            --region $CLOUD_RUN_REGION `
            --format 'value(status.url)' 2>$null
        if ($ServiceUrl) { Write-Ok $ServiceUrl }
        else { Write-Info "gcloud not configured locally — find URL at: https://console.cloud.google.com/run" }
    } else {
        Write-Info "gcloud not installed — find URL at: https://console.cloud.google.com/run"
    }
}

Write-Host ""
Write-Ok "Deploy complete 🚀"
Write-Host ""
