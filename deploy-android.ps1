# deploy-android.ps1  (Windows equivalent of deploy-android.sh)
# Build and optionally submit Android app via EAS Build + EAS Submit.
#
# Usage:
#   .\deploy-android.ps1                              # EAS build only (production)
#   .\deploy-android.ps1 -Target build -Profile preview
#   .\deploy-android.ps1 -Target submit               # submit latest to Play Store
#   .\deploy-android.ps1 -Target all                  # build + submit

param(
    [ValidateSet('build', 'submit', 'all')]
    [string]$Target  = 'build',
    [string]$Profile = 'production'
)

$ErrorActionPreference = 'Continue'

function Write-Step { param($n,$t) Write-Host "`n[$n] $t" -ForegroundColor Cyan }
function Write-Ok   { param($m)   Write-Host "  + $m" -ForegroundColor Green }
function Write-Warn { param($m)   Write-Host "  ! $m" -ForegroundColor Yellow }
function Write-Fail { param($m)   Write-Host "  x $m" -ForegroundColor Red }
function Abort      { param($m)   Write-Fail $m; exit 1 }

# ---- 1. Type-check -----------------------------------------------------------
Write-Step '1' 'Type-checking...'
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { Abort 'TypeScript errors found -- fix before building' }
Write-Ok 'No type errors'

# ---- 2. Ensure EAS CLI -------------------------------------------------------
Write-Step '2' 'Checking EAS CLI'
if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
    Write-Warn 'eas CLI not found -- installing globally'
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) { Abort 'Failed to install eas-cli' }
}
Write-Ok 'eas CLI ready'

# ---- 3. EAS Build ------------------------------------------------------------
if ($Target -eq 'build' -or $Target -eq 'all') {
    Write-Step '3' "EAS Build: android ($Profile)"
    eas build --platform android --profile $Profile --non-interactive
    if ($LASTEXITCODE -ne 0) { Abort 'EAS Build failed' }
    Write-Ok 'Android build submitted to EAS'
}

# ---- 4. EAS Submit -----------------------------------------------------------
if ($Target -eq 'submit' -or $Target -eq 'all') {
    Write-Step '4' 'EAS Submit: android -> Play Store'
    eas submit --platform android --latest --non-interactive
    if ($LASTEXITCODE -ne 0) { Abort 'EAS Submit failed' }
    Write-Ok 'Submitted to Play Store'
}

Write-Host ''
Write-Ok "Android deploy complete! (target=$Target, profile=$Profile)"
Write-Host ''
