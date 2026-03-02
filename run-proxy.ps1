# run-proxy.ps1
# Loads .env, then starts the Puppeteer proxy server (CORS bypass + screenshot endpoint).
#
# Flags:
#   -LocalChrome    Attach to your running local Chrome (via start-chrome-debug.ps1).
#   -Android        Attach to your Android Chrome via ADB forward (via start-android-debug.ps1).
#   -CDPPort        CDP port to connect to (default 9222 for both modes).
param(
    [switch]$LocalChrome,
    [switch]$Android,
    [int]$CDPPort = 9222
)

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
$ProxyPort = 3000

Write-Host "--- Sentient UI: Proxy Server ---" -ForegroundColor Cyan

# Load .env so proxy can access OAuth/API keys
. "$ProjectDir\load-env.ps1"

if ($LocalChrome -or $Android) {
    $cdpUrl = "http://localhost:$CDPPort"
    [System.Environment]::SetEnvironmentVariable("LOCAL_CDP_URL", $cdpUrl, "Process")
    if ($Android) {
        Write-Host "📱 Android mode — attaching to CDP at $cdpUrl" -ForegroundColor Green
        Write-Host "   Make sure ADB forward is active: .\start-android-debug.ps1" -ForegroundColor DarkYellow
    } else {
        Write-Host "🔗 Local Chrome mode — attaching to CDP at $cdpUrl" -ForegroundColor Green
        Write-Host "   Make sure Chrome is running: .\start-chrome-debug.ps1" -ForegroundColor DarkYellow
    }
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
