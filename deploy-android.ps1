# deploy-android.ps1  (Windows — local Gradle build + ADB sideload)
#
# Usage:
#   .\deploy-android.ps1 -Target build               # Gradle APK build only
#   .\deploy-android.ps1 -Target adb                 # build + adb install + launch  (DEFAULT)
#   .\deploy-android.ps1 -Target adb -ForcePrebuild  # force expo prebuild --clean first
#   .\deploy-android.ps1 -Target gh-adb              # download GitHub Release APK + adb install
#   .\deploy-android.ps1 -Target eas -Profile preview # EAS cloud build (requires: eas login)
#   .\deploy-android.ps1 -Target eas-submit          # submit latest EAS build to Play Store

param(
    [ValidateSet('build', 'adb', 'gh-adb', 'eas', 'eas-submit')]
    [string]$Target        = 'adb',
    [string]$Profile       = 'preview',
    [switch]$ForcePrebuild,   # force expo prebuild --clean even if android/ already exists
    [switch]$SkipTsCheck      # skip tsc --noEmit (saves ~15s on fast iterations)
)

$ErrorActionPreference = 'Continue'

function Write-Step { param($n,$t) Write-Host "`n[$n] $t" -ForegroundColor Cyan }
function Write-Ok   { param($m)   Write-Host "  + $m" -ForegroundColor Green }
function Write-Warn { param($m)   Write-Host "  ! $m" -ForegroundColor Yellow }
function Write-Fail { param($m)   Write-Host "  x $m" -ForegroundColor Red }
function Abort      { param($m)   Write-Fail $m; exit 1 }

# ---- 1. Type-check (skippable) -----------------------------------------------
if (-not $SkipTsCheck) {
    Write-Step '1' 'Type-checking...'
    npx tsc --noEmit 2>&1 | Where-Object { $_ -match 'error TS' } | Select-Object -First 20 | Write-Host
    if ($LASTEXITCODE -ne 0) { Write-Warn 'TypeScript errors found (continuing build anyway)' }
    else { Write-Ok 'No type errors' }
} else {
    Write-Step '1' 'Type-check skipped (-SkipTsCheck)'
}

# ── Helper: apply patches to android/ after prebuild ──────────────────────────
function Apply-AndroidPatches {
    # Disable New Architecture (avoids CMake path bug with OneDrive deep paths on Windows)
    $gpFile = '.\android\gradle.properties'
    (Get-Content $gpFile) -replace 'newArchEnabled=true', 'newArchEnabled=false' | Set-Content $gpFile
    Write-Ok 'gradle.properties: newArchEnabled=false'

    # Empty debuggableVariants so Gradle bundles JS into the debug APK.
    # Why: the default ["debug"] tells RN to skip bundling and load from Metro,
    #      making the APK show "Unable to load script" when Metro isn't running.
    $bgFile = '.\android\app\build.gradle'
    $bgRaw  = Get-Content $bgFile -Raw
    if ($bgRaw -notmatch 'debuggableVariants\s*=\s*\[\s*\]') {
        # Replace any existing debuggableVariants line or the commented-out example
        $bgRaw = $bgRaw -replace '(?m)^\s*//\s*debuggableVariants\s*=.*$', '    debuggableVariants = []'
        $bgRaw = $bgRaw -replace '(?m)^\s*debuggableVariants\s*=\s*\[(?!\s*\]).*$', '    debuggableVariants = []'
        Set-Content $bgFile $bgRaw -NoNewline
    }
    Write-Ok 'build.gradle: debuggableVariants=[] (JS bundled into APK, no Metro needed)'

    # Clear stale expo-constants Gradle build cache (causes BUILD FAILED on Windows)
    foreach ($p in @('node_modules\expo\node_modules\expo-constants\android\build',
                     'node_modules\expo-constants\android\build')) {
        if (Test-Path $p) { Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue; Write-Ok "Cleared: $p" }
    }
}

# ── Helper: local Gradle build ─────────────────────────────────────────────────
function Invoke-LocalBuild {
    # Skip prebuild if android/gradlew already exists — saves 5-10 min re-download.
    # Pass -ForcePrebuild to regenerate when native deps change.
    if ($ForcePrebuild -or -not (Test-Path '.\android\gradlew')) {
        Write-Step '2' 'Expo prebuild --clean (generating android/ native project)'
        npx expo prebuild --platform android --clean 2>&1 |
            Where-Object { $_ -match 'Created|Updated|Finished|Warning|error' }
        if ($LASTEXITCODE -ne 0) { Abort 'expo prebuild failed' }
        Write-Ok 'Prebuild complete'
    } else {
        Write-Step '2' 'Skipping expo prebuild (android/gradlew exists — use -ForcePrebuild to regenerate)'
    }

    Apply-AndroidPatches

    Write-Step '3' 'Gradle assembleDebug (streaming output)'
    # NODE_ENV required by expo-constants createExpoConfig task
    $env:NODE_ENV = 'production'
    Push-Location .\android
    # Stream output live so progress is visible; tee to log for post-mortem
    .\gradlew assembleDebug --console=plain 2>&1 | Tee-Object -FilePath '..\android-build.log'
    $gradleExit = $LASTEXITCODE
    Pop-Location

    if ($gradleExit -ne 0) {
        Write-Fail "Gradle failed (exit $gradleExit) — last 20 lines:"
        Get-Content '.\android-build.log' -Tail 20 | Write-Host
        Abort 'Fix Gradle errors above then re-run.'
    }

    $apk = Get-ChildItem '.\android\app\build\outputs\apk\debug' -Filter '*.apk' -ErrorAction SilentlyContinue |
           Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $apk) { Abort 'APK not found after successful Gradle build.' }
    Write-Ok "APK ready: $($apk.Name)  ($([math]::Round($apk.Length/1MB,1)) MB)"
    return $apk
}

# ── Helper: ADB prerequisites check ───────────────────────────────────────────
function Assert-AdbReady {
    if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
        Abort 'adb not found in PATH. Install Android SDK Platform-Tools and add to PATH.'
    }
    # Why: wireless/mDNS device names contain spaces so ^\S+\s+device$ never matches.
    # Match any non-header line that contains the status word ' device' (with trailing space or EOL).
    $devices = adb devices -l | Where-Object { $_ -notmatch '^List of' -and $_ -match '\bdevice\b' -and $_.Trim() -ne '' }
    if (-not $devices) { Abort 'No ADB device detected. Connect your device and enable USB debugging.' }
    Write-Ok "Device ready: $($devices -join ', ')"
}

# ---- build: local Gradle APK (no install) ------------------------------------
if ($Target -eq 'build') {
    Invoke-LocalBuild | Out-Null
}

# ---- adb: local build + install + launch -------------------------------------
if ($Target -eq 'adb') {
    Assert-AdbReady
    $apk = Invoke-LocalBuild

    Write-Step '4' 'Installing APK via ADB (adb install -r)'
    adb install -r $apk.FullName
    if ($LASTEXITCODE -ne 0) { Abort 'adb install failed. Check device connection and USB debugging.' }
    Write-Ok 'APK installed on device'

    Write-Step '5' 'Launching app'
    adb shell monkey -p com.antigravity.sentientaibrowser -c android.intent.category.LAUNCHER 1
    Write-Ok 'App launched on device'
}

# ---- gh-adb: GitHub Release APK -> ADB sideload (no local build) -------------
if ($Target -eq 'gh-adb') {
    Write-Step '2' 'Checking prerequisites (gh CLI + ADB)'
    if (-not (Get-Command gh  -ErrorAction SilentlyContinue)) { Abort 'gh CLI not found. Install from https://cli.github.com' }
    Assert-AdbReady

    Write-Step '3' 'Downloading latest APK from GitHub Releases'
    $tmpDir = Join-Path $env:TEMP 'sentient-apk'
    New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
    gh release download --pattern '*.apk' --dir $tmpDir
    if ($LASTEXITCODE -ne 0) { Abort 'gh release download failed. Make sure there is a published release with an APK asset.' }
    $apk = Get-ChildItem -Path $tmpDir -Filter '*.apk' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $apk) { Abort 'APK not found in release download.' }
    Write-Ok "Downloaded: $($apk.Name) ($([math]::Round($apk.Length/1MB,1)) MB)"

    Write-Step '4' 'Installing via ADB'
    adb install -r $apk.FullName
    if ($LASTEXITCODE -ne 0) { Abort 'adb install failed.' }
    Write-Ok 'APK installed'

    Write-Step '5' 'Launching app'
    adb shell monkey -p com.antigravity.sentientaibrowser -c android.intent.category.LAUNCHER 1
    Write-Ok 'App launched'
}

# ---- eas: EAS cloud build (requires: eas login) ------------------------------
if ($Target -eq 'eas') {
    Write-Step '2' 'Checking EAS CLI'
    if (-not (Get-Command eas -ErrorAction SilentlyContinue)) {
        Write-Warn 'eas CLI not found -- installing globally'
        npm install -g eas-cli
        if ($LASTEXITCODE -ne 0) { Abort 'Failed to install eas-cli' }
    }
    Write-Ok 'eas CLI ready'

    Write-Step '3' "EAS Build: android ($Profile)"
    eas build --platform android --profile $Profile --non-interactive
    if ($LASTEXITCODE -ne 0) { Abort 'EAS Build failed. Run: eas login' }
    Write-Ok 'Android build submitted to EAS'
}

# ---- eas-submit: EAS Submit -> Play Store ------------------------------------
if ($Target -eq 'eas-submit') {
    Write-Step '2' 'EAS Submit: android -> Play Store'
    eas submit --platform android --latest --non-interactive
    if ($LASTEXITCODE -ne 0) { Abort 'EAS Submit failed' }
    Write-Ok 'Submitted to Play Store'
}

Write-Host ''
Write-Ok "Android deploy complete! (target=$Target, profile=$Profile)"
Write-Host ''