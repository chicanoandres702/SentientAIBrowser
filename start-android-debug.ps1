# start-android-debug.ps1
# Forwards Android Chrome's CDP WebSocket to localhost:9222 via ADB,
# so Playwright can attach to your real Android browser — all cookies and
# sessions included, exactly like the local-Chrome mode but on your phone.
#
# Prerequisites:
#   1. Enable Developer Options on Android  →  Settings > About Phone > tap Build Number 7x
#   2. Enable USB Debugging                 →  Developer Options > USB Debugging
#   3. OR enable Wireless Debugging         →  Developer Options > Wireless Debugging
#   4. Install ADB: https://developer.android.com/studio/releases/platform-tools
#   5. On your phone: open Chrome and browse to any page (Chrome must be in the foreground)
#
# Usage:
#   USB:  Plug in USB cable, then:  .\start-android-debug.ps1
#   WiFi: .\start-android-debug.ps1 -WifiIp 192.168.1.42          (phone's IP)
#         .\start-android-debug.ps1 -WifiIp 192.168.1.42 -WifiPort 5555
#
# After this script succeeds, run:
#   .\run-proxy.ps1 -Android
#
# Browser socket names (use -Socket to override):
#   Chrome stable:  chrome_devtools_remote          (default)
#   Chrome Beta:    chrome_devtools_remote_beta
#   Chrome Canary:  chrome_devtools_remote_canary
#   Kiwi Browser:   kiwi_devtools_remote
#   Firefox:        org.mozilla.firefox/firefox_devtools_remote

param(
    [string]$WifiIp   = '',
    [int]   $WifiPort = 5555,
    [int]   $LocalPort = 9222,
    [string]$Socket   = 'chrome_devtools_remote'
)

$ErrorActionPreference = 'Stop'

# ── Locate ADB ────────────────────────────────────────────────────────────────
$adb = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adb) {
    # Common install locations
    $candidates = @(
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
        "$env:ProgramFiles\Android\android-sdk\platform-tools\adb.exe",
        "$env:USERPROFILE\AppData\Local\Android\Sdk\platform-tools\adb.exe"
    )
    $found = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $found) {
        Write-Error "ADB not found. Install Android Platform Tools:`n  https://developer.android.com/studio/releases/platform-tools`nOr add it to PATH."
        exit 1
    }
    $adb = $found
} else {
    $adb = $adb.Source
}
Write-Host "✅ ADB found: $adb" -ForegroundColor DarkGray

# ── Connect over WiFi if IP provided ──────────────────────────────────────────
if ($WifiIp) {
    Write-Host "📡 Connecting to Android over WiFi at ${WifiIp}:${WifiPort}..." -ForegroundColor Cyan
    # Switch USB device to TCP mode first (requires USB cable for the first time)
    & $adb tcpip $WifiPort 2>&1 | Out-Null
    Start-Sleep -Milliseconds 800
    $connectOut = & $adb connect "${WifiIp}:${WifiPort}" 2>&1
    Write-Host "   $connectOut"
    if ($connectOut -match 'unable|failed|error') {
        Write-Error "WiFi ADB connect failed. Make sure the phone is on the same network and Wireless Debugging is enabled."
        exit 1
    }
    Start-Sleep -Milliseconds 500
}

# ── Verify a device is visible ────────────────────────────────────────────────
$devices = & $adb devices 2>&1 | Select-String 'device$'
if (-not $devices) {
    Write-Error "No Android device found.`n  • USB: check cable + accept the 'Allow USB Debugging' prompt on your phone.`n  • WiFi: run with -WifiIp <phone-ip>"
    exit 1
}
Write-Host "📱 Device(s) detected:" -ForegroundColor Green
$devices | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }

# ── Kill any stale forward on the local port ──────────────────────────────────
& $adb forward --remove "tcp:$LocalPort" 2>&1 | Out-Null

# ── Forward Android Chrome CDP socket to localhost ────────────────────────────
Write-Host "🔗 Forwarding tcp:$LocalPort → localabstract:$Socket ..." -ForegroundColor Cyan
$fwd = & $adb forward "tcp:$LocalPort" "localabstract:$Socket" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "ADB forward failed: $fwd`n  Is Chrome open and in the foreground on your phone?"
    exit 1
}
Write-Host "✅ ADB forward active on localhost:$LocalPort" -ForegroundColor Green

# ── Verify the CDP endpoint is reachable ─────────────────────────────────────
Write-Host "🔍 Checking CDP endpoint..." -ForegroundColor DarkGray
try {
    $resp = Invoke-RestMethod "http://localhost:$LocalPort/json/version" -TimeoutSec 5
    Write-Host "✅ Connected to: $($resp.Browser) — $($resp.'WebSocket Debugger Url')" -ForegroundColor Green
} catch {
    Write-Warning "CDP endpoint not responding yet. Chrome may still be loading — try running:`n  .\run-proxy.ps1 -Android"
}

Write-Host ""
Write-Host "Now run: " -NoNewline
Write-Host ".\run-proxy.ps1 -Android" -ForegroundColor Yellow
Write-Host "Playwright will control your Android Chrome with all your cookies and sessions." -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop forwarding when done: " -NoNewline
Write-Host "adb forward --remove tcp:$LocalPort" -ForegroundColor DarkGray
