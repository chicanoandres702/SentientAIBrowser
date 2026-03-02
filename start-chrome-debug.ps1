# start-chrome-debug.ps1
# Launches Chrome with remote debugging on port 9222 so the local proxy can
# attach to YOUR real profile — all your cookies, sessions, and saved logins
# are immediately available to Playwright.
#
# Usage:
#   1. Run this script (it launches Chrome with debugging enabled)
#   2. Set LOCAL_CDP_URL=http://localhost:9222 in your .env or run-proxy.ps1
#   3. Start the proxy: .\run-proxy.ps1
#   Playwright will attach to YOUR Chrome instead of launching a new headless one.
#
# Note: Chrome must not already be running when this script launches it.
# If Chrome is already open, close it first or use --user-data-dir to open
# a second profile alongside your existing session.

$CDPPort    = 9222
$ChromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
$ChromeAlt  = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"

if (-not (Test-Path $ChromePath)) { $ChromePath = $ChromeAlt }
if (-not (Test-Path $ChromePath)) {
    Write-Error "Chrome not found. Update `$ChromePath in this script."
    exit 1
}

# Check if port is already in use (Chrome already running with debugging)
$portInUse = (Get-NetTCPConnection -LocalPort $CDPPort -ErrorAction SilentlyContinue)
if ($portInUse) {
    Write-Host "✅ Chrome debugging already active on port $CDPPort" -ForegroundColor Green
    Write-Host "   Set LOCAL_CDP_URL=http://localhost:$CDPPort and start the proxy." -ForegroundColor Cyan
    exit 0
}

Write-Host "🚀 Launching Chrome with CDP debugging on port $CDPPort..." -ForegroundColor Cyan
Write-Host "   Your real profile (cookies, sessions, logins) will be available to Playwright." -ForegroundColor Gray

Start-Process $ChromePath -ArgumentList @(
    "--remote-debugging-port=$CDPPort",
    "--remote-allow-origins=*",
    # Why: profile-dir=Default uses your main Chrome profile.
    # Change to a different profile name if you want to isolate sessions.
    "--profile-directory=Default"
)

Write-Host ""
Write-Host "✅ Chrome launched." -ForegroundColor Green
Write-Host "   Now run: " -NoNewline
Write-Host ".\run-proxy.ps1" -ForegroundColor Yellow
Write-Host "   (Make sure LOCAL_CDP_URL=http://localhost:$CDPPort is in your .env)" -ForegroundColor Cyan
