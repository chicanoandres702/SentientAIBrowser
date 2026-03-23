# run-proxy.ps1
# Loads .env, then starts the Sentient proxy server.
#
# Flags:
#   -LocalChrome          Attach to your running local Chrome (via start-chrome-debug.ps1).
#   -Android              Attach to Android Chrome via CDP.
#   -PhoneIp <ip>         Phone's WiFi IP — uses Termux/socat (no ADB needed).
#                         Omit -PhoneIp to use ADB port-forward mode instead.
#   -CDPPort <port>       CDP port number (default 9222).
#
# Examples:
#   .\run-proxy.ps1 -LocalChrome
#   .\run-proxy.ps1 -Android -PhoneIp 192.168.1.42
#   .\run-proxy.ps1 -Android                          # ADB mode (run start-android-debug.ps1 first)
param(
    [switch]$LocalChrome,
    [switch]$Android,
    [string]$PhoneIp  = '',
    [int]   $CDPPort  = 9222
)

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
$ProxyPort = 3000

Write-Host "--- Sentient UI: Proxy Server ---" -ForegroundColor Cyan

# Load .env so proxy can access OAuth/API keys
. "$ProjectDir\load-env.ps1"

if ($Android -and $PhoneIp) {
    # WiFi mode — no ADB, Termux socat bridges the CDP socket over WiFi
    $cdpUrl = "http://${PhoneIp}:${CDPPort}"
    [System.Environment]::SetEnvironmentVariable("LOCAL_CDP_URL", $cdpUrl, "Process")
    Write-Host "📱 Android WiFi mode — connecting to ${PhoneIp}:${CDPPort}" -ForegroundColor Green
    Write-Host "   Pseudo cursor + keystrokes forwarded via CDP WebSocket" -ForegroundColor DarkGray
    Write-Host "   (socat must be running in Termux on your phone)" -ForegroundColor DarkYellow
} elseif ($Android) {
    # ADB forward mode — run start-android-debug.ps1 first
    $cdpUrl = "http://localhost:$CDPPort"
    [System.Environment]::SetEnvironmentVariable("LOCAL_CDP_URL", $cdpUrl, "Process")
    Write-Host "📱 Android ADB mode — attaching to CDP at $cdpUrl" -ForegroundColor Green
    Write-Host "   Pseudo cursor + keystrokes forwarded via CDP WebSocket" -ForegroundColor DarkGray
    Write-Host "   (run start-android-debug.ps1 first to set up ADB forward)" -ForegroundColor DarkYellow
} elseif ($LocalChrome) {
    $cdpUrl = "http://localhost:$CDPPort"
    [System.Environment]::SetEnvironmentVariable("LOCAL_CDP_URL", $cdpUrl, "Process")
    Write-Host "🔗 Local Chrome mode — attaching to CDP at $cdpUrl" -ForegroundColor Green
    Write-Host "   Pseudo cursor + keystrokes forwarded via CDP WebSocket" -ForegroundColor DarkGray
    Write-Host "   (run start-chrome-debug.ps1 first to launch Chrome with debugging)" -ForegroundColor DarkYellow
}

# Kill any process already holding the proxy port
$portProcess = netstat -ano | Select-String ":$ProxyPort " | Select-String "LISTENING"
if ($portProcess) {
    $portPid = ($portProcess -split '\s+')[-1]
    Write-Host "Freeing port $ProxyPort (PID $portPid)..." -ForegroundColor Yellow
    Stop-Process -Id $portPid -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting Proxy Server on port $ProxyPort..." -ForegroundColor Green
Set-Location $ProjectDir
node functions/lib/proxy-server.js
