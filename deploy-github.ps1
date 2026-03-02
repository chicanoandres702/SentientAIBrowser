# deploy-github.ps1
# Full deploy via GitHub Actions: pre-flight -> git push -> watch live status -> Cloud Run URL
#
# Usage:
#   .\deploy-github.ps1                        # deploy all (firestore rules + cloudrun + hosting)
#   .\deploy-github.ps1 -Target cloudrun       # Cloud Run only
#   .\deploy-github.ps1 -Target functions      # Firestore rules only
#   .\deploy-github.ps1 -Target hosting        # Firebase Hosting only
#   .\deploy-github.ps1 -NoPush                # skip git commit/push (use current HEAD)
#   .\deploy-github.ps1 -Watch:$false          # trigger and exit without tailing logs
#
# Requires: gh CLI authenticated (gh auth login)

param(
    [ValidateSet('all', 'hosting', 'functions', 'cloudrun')]
    [string]$Target = 'all',
    [switch]$NoPush,
    [bool]$Watch = $true
)

$CLOUD_RUN_SERVICE = 'sentient-proxy'
$CLOUD_RUN_REGION  = 'us-central1'

function Write-Step  { param($n,$t) Write-Host "`n[$n] $t" -ForegroundColor Cyan }
function Write-Ok    { param($m)   Write-Host "  + $m" -ForegroundColor Green }
function Write-Warn  { param($m)   Write-Host "  ! $m" -ForegroundColor Yellow }
function Write-Fail  { param($m)   Write-Host "  x $m" -ForegroundColor Red }
function Write-Info  { param($m)   Write-Host "  . $m" -ForegroundColor DarkGray }
function Abort       { param($m)   Write-Fail $m; exit 1 }

# ---- 1. Pre-flight -----------------------------------------------------------
Write-Step '1' 'Pre-flight checks'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Abort 'gh CLI not found. Install: https://cli.github.com'
}
gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Abort 'gh not authenticated. Run: gh auth login' }
Write-Ok 'gh CLI authenticated'

$Repo   = gh repo view --json nameWithOwner -q .nameWithOwner 2>$null
$Branch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $Repo)   { Abort 'Not inside a GitHub repo.' }
if (-not $Branch) { Abort 'Not inside a git repo.' }
Write-Ok "Repo  : $Repo"
Write-Ok "Branch: $Branch"
Write-Ok "Target: $Target"

if (Get-Command gcloud -ErrorAction SilentlyContinue) {
    $GcloudAccount = (gcloud config get-value account 2>$null).Trim()
    if ($GcloudAccount) { Write-Ok "gcloud account: $GcloudAccount" }
    else { Write-Warn 'gcloud not authenticated locally (CI uses FIREBASE_SERVICE_ACCOUNT -- OK)' }
}

# ---- 2. Git commit + push ----------------------------------------------------
if (-not $NoPush) {
    Write-Step '2' 'Git -- commit & push'

    # Suppress NativeCommandError: git outputs CRLF warnings to stderr which
    # triggers Stop-level errors in PS5. Capture with 2>&1 and filter them out.
    $prev = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    $Staged    = (git diff --cached --name-only 2>&1) | Where-Object { $_ -notmatch '^warning:' }
    $Unstaged  = (git diff --name-only          2>&1) | Where-Object { $_ -notmatch '^warning:' }
    $Untracked = (git ls-files --others --exclude-standard 2>&1) | Where-Object { $_ -notmatch '^warning:' }
    $ErrorActionPreference = $prev

    if ($Staged -or $Unstaged -or $Untracked) {
        git add -A
        $Stamp   = Get-Date -Format 'yyyy-MM-dd HH:mm'
        $Message = "chore: deploy snapshot [$Target] $Stamp"
        git commit -m $Message
        Write-Ok "Committed: $Message"
    } else {
        Write-Info 'Nothing to commit -- pushing current HEAD'
    }

    git push origin $Branch
    if ($LASTEXITCODE -ne 0) { Abort 'git push failed' }
    Write-Ok "Pushed to $Branch"
} else {
    Write-Info '-NoPush: skipping git commit/push'
}

# ---- 3. Trigger GitHub Actions -----------------------------------------------
Write-Step '3' "Triggering GitHub Actions (target=$Target)"

gh workflow run deploy.yml --repo $Repo --ref $Branch --field target=$Target
if ($LASTEXITCODE -ne 0) { Abort "Could not trigger workflow (does deploy.yml exist on $Branch?)" }

Start-Sleep -Seconds 5

$RunId  = gh run list --repo $Repo --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId'
$RunUrl = "https://github.com/$Repo/actions/runs/$RunId"
Write-Ok "Run ID : $RunId"
Write-Ok "URL    : $RunUrl"

# ---- 4. Live status ----------------------------------------------------------
if ($Watch -and $RunId) {
    Write-Step '4' 'Waiting for jobs to complete  (Ctrl+C to detach)'
    Write-Info "Following: $RunUrl"
    Write-Host ''

    gh run watch $RunId --repo $Repo --exit-status
    $ExitCode = $LASTEXITCODE

    Write-Host ''
    Write-Step '4b' 'Job results'
    $JobsRaw = gh run view $RunId --repo $Repo --json jobs 2>$null
    if ($JobsRaw) {
        try {
            $JobsObj = $JobsRaw | ConvertFrom-Json
            foreach ($j in $JobsObj.jobs) {
                $status  = if ($j.conclusion) { $j.conclusion } else { 'running' }
                switch ($status) {
                    'success'  { Write-Ok   "$($j.name)" }
                    'skipped'  { Write-Info "SKIPPED  $($j.name)" }
                    'failure'  { Write-Fail "$($j.name)" }
                    default    { Write-Warn "$status  $($j.name)" }
                }
            }
        } catch { Write-Warn "Could not parse job results: $_" }
    }

    if ($ExitCode -ne 0) {
        Write-Host ''
        Abort "One or more jobs failed. Logs: gh run view $RunId --repo $Repo --log-failed"
    }
} else {
    Write-Info '-Watch:$false -- not tailing logs.'
    Write-Info "Monitor: gh run watch $RunId --repo $Repo"
}

# ---- 5. Post-deploy Cloud Run URL -------------------------------------------
if ($Target -in 'all','cloudrun') {
    Write-Step '5' 'Cloud Run service URL'
    if (Get-Command gcloud -ErrorAction SilentlyContinue) {
        $ServiceUrl = (gcloud run services describe $CLOUD_RUN_SERVICE `
            --region $CLOUD_RUN_REGION `
            --format 'value(status.url)' 2>$null).Trim()
        if ($ServiceUrl) { Write-Ok $ServiceUrl }
        else { Write-Info 'gcloud not configured locally -- see https://console.cloud.google.com/run' }
    } else {
        Write-Info 'gcloud not installed -- see https://console.cloud.google.com/run'
    }
}

Write-Host ''
Write-Ok 'Deploy complete!'
Write-Host ''