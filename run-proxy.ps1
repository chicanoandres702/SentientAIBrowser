# run-proxy.ps1
# Loads .env, then starts the Puppeteer proxy server (CORS bypass + screenshot endpoint).

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
$ProxyPort = 3000

Write-Host "--- Sentient UI: Proxy Server ---" -ForegroundColor Cyan

# Load .env so proxy can access OAuth/API keys
. "$ProjectDir\load-env.ps1"

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
