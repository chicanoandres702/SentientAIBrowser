# start-android-wifi.ps1
# Connects to Android Chrome over pure WiFi — NO USB, NO ADB required.
#
# How it works:
#   Chrome on Android listens on a Unix abstract socket (chrome_devtools_remote).
#   Termux + socat bridges that socket to a real TCP port on your WiFi interface,
#   so this PC can connect directly via Playwright's connectOverCDP.
#
# ── One-time phone setup (do this once) ──────────────────────────────────────
#   1. Install Termux from F-Droid (NOT Google Play — Play version is outdated):
#      https://f-droid.org/packages/com.termux/
#   2. Open Termux and run:
#         pkg update && pkg install socat
#   3. Done. No developer options, no USB debugging required.
#
# ── Every session ─────────────────────────────────────────────────────────────
#   Phone (Termux, run once per session — or make it a Termux:Widget shortcut):
#     socat TCP-LISTEN:9222,fork,reuseaddr ABSTRACT-CONNECT:chrome_devtools_remote
#
#   PC (this script, then proxy):
#     .\start-android-wifi.ps1 -PhoneIp 192.168.1.42
#     .\run-proxy.ps1 -Android -PhoneIp 192.168.1.42
#
# ── Tip: make the Termux command a one-tap shortcut ───────────────────────────
#   In Termux:
#     mkdir -p ~/.shortcuts
#     echo '#!/data/data/com.termux/files/usr/bin/bash' > ~/.shortcuts/cdp.sh
#     echo 'socat TCP-LISTEN:9222,fork,reuseaddr ABSTRACT-CONNECT:chrome_devtools_remote' >> ~/.shortcuts/cdp.sh
#     chmod +x ~/.shortcuts/cdp.sh
#   Then install Termux:Widget and add it to your home screen.
#
# ── Other browsers ────────────────────────────────────────────────────────────
#   Chrome Beta:   ABSTRACT-CONNECT:chrome_devtools_remote_beta
#   Chrome Canary: ABSTRACT-CONNECT:chrome_devtools_remote_canary
#   Kiwi Browser:  ABSTRACT-CONNECT:kiwi_devtools_remote
#   Firefox:       ABSTRACT-CONNECT:org.mozilla.firefox/firefox_devtools_remote

param(
    [Parameter(Mandatory)][string]$PhoneIp,
    [int]$PhonePort  = 9222,
    [int]$LocalPort  = 9222
)

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "📱 Android WiFi CDP Setup" -ForegroundColor Cyan
Write-Host "   Phone: ${PhoneIp}:${PhonePort}  →  localhost:${LocalPort}" -ForegroundColor DarkGray
Write-Host ""

# ── Check Chrome is reachable on the phone ────────────────────────────────────
Write-Host "🔍 Checking CDP endpoint on phone..." -ForegroundColor DarkGray
try {
    $resp = Invoke-RestMethod "http://${PhoneIp}:${PhonePort}/json/version" -TimeoutSec 5
    Write-Host "✅ Connected to: $($resp.Browser)" -ForegroundColor Green
    if ($resp.webSocketDebuggerUrl) {
        Write-Host "   WS: $($resp.webSocketDebuggerUrl)" -ForegroundColor DarkGray
    }
} catch {
    Write-Host ""
    Write-Host "❌ Could not reach Chrome CDP on ${PhoneIp}:${PhonePort}" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you ran socat in Termux on your phone:" -ForegroundColor Yellow
    Write-Host "  socat TCP-LISTEN:9222,fork,reuseaddr ABSTRACT-CONNECT:chrome_devtools_remote" -ForegroundColor White
    Write-Host ""
    Write-Host "Checklist:" -ForegroundColor Yellow
    Write-Host "  ✓ Termux installed from F-Droid (not Play Store)" -ForegroundColor DarkGray
    Write-Host "  ✓ socat installed in Termux:  pkg install socat" -ForegroundColor DarkGray
    Write-Host "  ✓ Chrome is open and in the foreground on your phone" -ForegroundColor DarkGray
    Write-Host "  ✓ Phone and PC on the same WiFi network" -ForegroundColor DarkGray
    Write-Host "  ✓ Phone firewall/battery saver not blocking port 9222" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Find your phone's IP:  Settings > WiFi > tap your network" -ForegroundColor DarkGray
    exit 1
}

# ── If phone port differs from local port, forward via netsh (no ADB needed) ─
if ($PhonePort -ne $LocalPort) {
    Write-Host "🔗 Forwarding localhost:$LocalPort → ${PhoneIp}:${PhonePort} via portproxy..." -ForegroundColor Cyan
    netsh interface portproxy add v4tov4 `
        listenport=$LocalPort listenaddress=127.0.0.1 `
        connectport=$PhonePort connectaddress=$PhoneIp | Out-Null
    Write-Host "✅ Port proxy active (localhost:$LocalPort)" -ForegroundColor Green
    Write-Host "   To remove when done:  netsh interface portproxy delete v4tov4 listenport=$LocalPort listenaddress=127.0.0.1" -ForegroundColor DarkGray
}

# ── Set env so run-proxy.ps1 -Android picks it up automatically ───────────────
$cdpTarget = if ($PhonePort -eq $LocalPort) { "http://${PhoneIp}:${PhonePort}" } else { "http://localhost:${LocalPort}" }
[System.Environment]::SetEnvironmentVariable("LOCAL_CDP_URL", $cdpTarget, "Process")

Write-Host ""
Write-Host "Now run: " -NoNewline
Write-Host ".\run-proxy.ps1 -Android -PhoneIp $PhoneIp" -ForegroundColor Yellow
Write-Host ""
Write-Host "Playwright will:" -ForegroundColor Cyan
Write-Host "  • Reuse your open Chrome tab (no blank tab opened)" -ForegroundColor DarkGray
Write-Host "  • Forward all clicks + keystrokes → your phone's Chrome" -ForegroundColor DarkGray
Write-Host "  • Show the pseudo cursor overlay on every AI action" -ForegroundColor DarkGray
Write-Host "  • Sync URL changes to Firestore in real time via CDP binding" -ForegroundColor DarkGray
Write-Host ""
