# deploy-frontend.ps1
# Why: Full frontend pipeline — clean, build TSX, deploy to Hosting.
# Combines cache clearing, env loading, Expo export, and Firebase deploy.

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
Set-Location $ProjectDir

Write-Host ""
Write-Host "=== Sentient UI: Full Frontend Deploy ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear stale caches that cause ghost styles
Write-Host "[1/5] Clearing caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "$ProjectDir\node_modules\.cache" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$ProjectDir\.expo" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$ProjectDir\dist" -ErrorAction SilentlyContinue
Write-Host "  Caches cleared." -ForegroundColor DarkGray

# Step 2: Load env vars so EXPO_PUBLIC_ keys bake into the bundle
Write-Host "[2/5] Loading environment..." -ForegroundColor Yellow
if (Test-Path "$ProjectDir\.env") {
    # Sanitize quotes that break Expo config injection
    $content = Get-Content "$ProjectDir\.env"
    $content = $content | ForEach-Object { $_ -replace '"', '' }
    $content | Set-Content "$ProjectDir\.env"
}
. "$ProjectDir\load-env.ps1"

# Step 3: TypeScript check — catch errors before building
Write-Host "[3/5] Type-checking TSX files..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ABORT] TypeScript errors found. Fix before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "  No type errors." -ForegroundColor DarkGray

# Step 4: Build Expo web bundle to dist/
Write-Host "[4/5] Building web bundle (Expo export)..." -ForegroundColor Green
npx expo export --platform web
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ABORT] Expo build failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Bundle ready -> dist/" -ForegroundColor DarkGray

# Step 5: Deploy to Firebase Hosting
Write-Host "[5/5] Deploying to Firebase Hosting..." -ForegroundColor Magenta
firebase deploy --only hosting --project sentient-ai-browser
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ABORT] Firebase Hosting deploy failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Frontend Deploy Complete ===" -ForegroundColor Green
Write-Host ""
