# deploy-direct.ps1
# Direct local deploy: Firebase Firestore rules + Google Cloud Run.
# No GitHub Actions round-trip -- pushes straight from your machine.
#
# Usage:
#   .\deploy-direct.ps1                     # build TS + deploy rules + cloudrun
#   .\deploy-direct.ps1 -Target cloudrun    # Cloud Run only
#   .\deploy-direct.ps1 -Target rules       # Firestore rules only
#   .\deploy-direct.ps1 -SkipBuild          # skip tsc (use existing lib/)
#   .\deploy-direct.ps1 -UseCloudBuild      # force Cloud Build instead of local Docker
#
# Prerequisites:
#   gcloud CLI authed  (gcloud auth login)
#   firebase CLI authed (firebase login)
#   Docker Desktop running  (optional -- falls back to Cloud Build)

param(
    [ValidateSet('all', 'cloudrun', 'rules')]
    [string]$Target = 'all',
    [switch]$SkipBuild,
    [switch]$UseCloudBuild
)

$PROJECT   = 'sentient-ai-browser'
$REGION    = 'us-central1'
$SERVICE   = 'sentient-proxy'
$IMAGE     = "gcr.io/$PROJECT/$SERVICE"
$MEMORY    = '2Gi'
$CPU       = '1'
$TIMEOUT   = '300'
$MIN_INST  = '0'
$MAX_INST  = '2'
$ROOT      = $PSScriptRoot
$FUNCTIONS = Join-Path $ROOT 'functions'

function Write-Step { param($n,$t) Write-Host "`n[$n] $t" -ForegroundColor Cyan }
function Write-Ok   { param($m)   Write-Host "    + $m" -ForegroundColor Green }
function Write-Warn { param($m)   Write-Host "    ! $m" -ForegroundColor Yellow }
function Write-Fail { param($m)   Write-Host "    x $m" -ForegroundColor Red }
function Abort      { param($m)   Write-Fail $m; exit 1 }

# ---- 1. Load .env secrets ----------------------------------------------------
Write-Step '1' 'Loading .env secrets'
$EnvFile = Join-Path $ROOT '.env'
$Env = @{}
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*"?([^"#]*)"?\s*$') {
            $Env[$Matches[1].Trim()] = $Matches[2].Trim()
        }
    }
    Write-Ok "Loaded $($Env.Count) vars from .env"
} else {
    Write-Warn '.env not found -- using process environment only'
}

function EnvVal { param($key) if ($Env.ContainsKey($key)) { $Env[$key] } else { [System.Environment]::GetEnvironmentVariable($key) } }

$GeminiKey    = EnvVal 'GOOGLE_API_KEY'
$PubGeminiKey = EnvVal 'EXPO_PUBLIC_GEMINI_API_KEY'
$ProxyApiKey  = EnvVal 'PROXY_API_KEY'
if (-not $GeminiKey)    { $GeminiKey    = $PubGeminiKey }
if (-not $PubGeminiKey) { $PubGeminiKey = $GeminiKey }
if (-not $GeminiKey -and $Target -ne 'rules') {
    Abort 'Missing GOOGLE_API_KEY / EXPO_PUBLIC_GEMINI_API_KEY in .env'
}
Write-Ok 'Secrets loaded'

# ---- 2. Pre-flight -----------------------------------------------------------
Write-Step '2' 'Pre-flight checks'

foreach ($cmd in @('gcloud','firebase')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Abort "$cmd CLI not found. Install it and add to PATH."
    }
}
Write-Ok 'gcloud + firebase CLIs found'

$GcloudAccount = (gcloud config get-value account 2>$null).Trim()
if (-not $GcloudAccount) { Abort 'gcloud not authenticated. Run: gcloud auth login' }
Write-Ok "gcloud account: $GcloudAccount"

gcloud config set project $PROJECT --quiet 2>$null
gcloud auth configure-docker --quiet 2>$null
Write-Ok "Active project: $PROJECT"

$DockerAvail = $false
if (-not $UseCloudBuild -and ($Target -eq 'all' -or $Target -eq 'cloudrun')) {
    $DockerAvail = [bool](Get-Command docker -ErrorAction SilentlyContinue)
    if ($DockerAvail) {
        docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { $DockerAvail = $false }
    }
    if ($DockerAvail) { Write-Ok 'Docker Desktop running -- will build locally (fast)' }
    else              { Write-Warn 'Docker not running -- will use Cloud Build (slower)' }
}

# ---- 3. Build TypeScript -----------------------------------------------------
if (-not $SkipBuild -and $Target -ne 'rules') {
    Write-Step '3' 'Compiling TypeScript (functions/)'
    Push-Location $FUNCTIONS
    try {
        npm run build 2>&1
        if ($LASTEXITCODE -ne 0) { Abort 'TypeScript build failed -- check errors above' }
        Write-Ok 'Build succeeded -> lib/'
    } finally { Pop-Location }
} else {
    Write-Step '3' 'Skipping TypeScript build (-SkipBuild or rules-only)'
}

# ---- 4. Deploy Firestore Rules -----------------------------------------------
if ($Target -eq 'all' -or $Target -eq 'rules') {
    Write-Step '4' 'Deploying Firestore rules + indexes'
    firebase deploy --only firestore:rules,firestore:indexes --non-interactive --project $PROJECT
    if ($LASTEXITCODE -ne 0) { Abort 'Firestore rules deploy failed' }
    Write-Ok 'Firestore rules + indexes deployed'
} else {
    Write-Step '4' 'Skipping Firestore rules (cloudrun target)'
}

# ---- 5. Build + Push Docker image --------------------------------------------
if ($Target -eq 'all' -or $Target -eq 'cloudrun') {
    $SHA = (git -C $ROOT rev-parse --short HEAD 2>$null).Trim()
    if (-not $SHA) { $SHA = (Get-Date -Format 'yyyyMMddHHmmss') }
    $TagSha    = "${IMAGE}:${SHA}"
    $TagLatest = "${IMAGE}:latest"

    if ($DockerAvail) {
        Write-Step '5' "Building Docker image locally -> $TagSha"
        docker build -t $TagSha -t $TagLatest $FUNCTIONS
        if ($LASTEXITCODE -ne 0) { Abort 'Docker build failed' }
        Write-Ok 'Image built'

        Write-Host '    Pushing to GCR...' -ForegroundColor DarkGray
        docker push $TagSha
        docker push $TagLatest
        if ($LASTEXITCODE -ne 0) { Abort 'Docker push failed' }
        Write-Ok "Pushed $TagSha"
    } else {
        Write-Step '5' "Cloud Build -> $TagSha"
        gcloud builds submit --tag $TagSha $FUNCTIONS --project $PROJECT --quiet
        if ($LASTEXITCODE -ne 0) { Abort 'Cloud Build failed' }
        Write-Ok 'Image built + pushed via Cloud Build'
    }

    # ---- 6. Deploy to Cloud Run ----------------------------------------------
    Write-Step '6' "Deploying $SERVICE to Cloud Run ($REGION)"
    $EnvVars = "NODE_ENV=production,GOOGLE_API_KEY=$GeminiKey,EXPO_PUBLIC_GEMINI_API_KEY=$PubGeminiKey"
    if ($ProxyApiKey) { $EnvVars += ",PROXY_API_KEY=$ProxyApiKey" }

    gcloud run deploy $SERVICE `
        --image         $TagSha `
        --region        $REGION `
        --project       $PROJECT `
        --platform      managed `
        --allow-unauthenticated `
        --memory        $MEMORY `
        --cpu           $CPU `
        --timeout       $TIMEOUT `
        --min-instances $MIN_INST `
        --max-instances $MAX_INST `
        --set-env-vars  $EnvVars `
        --quiet

    if ($LASTEXITCODE -ne 0) { Abort 'Cloud Run deploy failed' }

    $ServiceUrl = (gcloud run services describe $SERVICE --region $REGION --project $PROJECT --format 'value(status.url)' 2>$null).Trim()
    Write-Ok 'Cloud Run deployed'
    Write-Host ''
    Write-Host "  Live URL: $ServiceUrl" -ForegroundColor Green
    Write-Host ''
    if ($ServiceUrl) {
        Write-Warn 'If EXPO_PUBLIC_PROXY_URL changed, update it in .env and redeploy web.'
    }
} else {
    Write-Step '5/6' 'Skipping Docker build + Cloud Run (rules target)'
}

Write-Host ''
Write-Ok "Deploy complete! (target=$Target)"
Write-Host ''