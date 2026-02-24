# run-proxy.ps1
# Standalone launcher for the Puppeteer proxy server (CORS bypass + screenshot endpoint).

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot
$ProxyPort = 3000

Write-Host "--- Sentient UI: Proxy Server ---" -ForegroundColor Cyan

# Kill any process already holding the proxy port
$portProcess = netstat -ano | Select-String ":$ProxyPort " | Select-String "LISTENING"
if ($portProcess) {
    $pid = ($portProcess -split '\s+')[-1]
    Write-Host "Freeing port $ProxyPort (PID $pid)..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting Proxy Server on port $ProxyPort..." -ForegroundColor Green
Set-Location $ProjectDir
node proxy-server.js
