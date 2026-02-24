# run-web.ps1
# Starts proxy server in background, then launches Expo web dev server.
# Automatically kills any process holding port 8081 before starting.

$ErrorActionPreference = "Stop"
$Port = 8081
$ProjectDir = $PSScriptRoot

Write-Host "--- Sentient UI: Web Launcher ---" -ForegroundColor Cyan

# Kill any process holding the Expo port to avoid "port in use" prompts
$portProcess = netstat -ano | Select-String ":$Port " | Select-String "LISTENING"
if ($portProcess) {
    $pid = ($portProcess -split '\s+')[-1]
    Write-Host "Freeing port $Port (PID $pid)..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

# Start Proxy Server in a separate window so it keeps running
Write-Host "Starting Proxy Server (CORS Bypass)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir'; node proxy-server.js"

# Brief wait for proxy to be ready
Start-Sleep -Seconds 2

# Launch Expo Web
Write-Host "Launching Expo Web on port $Port..." -ForegroundColor Cyan
Set-Location $ProjectDir
npx expo start --web --port $Port
