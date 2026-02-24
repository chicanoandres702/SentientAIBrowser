# run-web.ps1
# Loads .env, starts proxy server in background, launches Expo web dev server.

$ErrorActionPreference = "Stop"
$Port = 8081
$ProjectDir = $PSScriptRoot

Write-Host "--- Sentient UI: Web Launcher ---" -ForegroundColor Cyan

# Load .env so EXPO_PUBLIC_ vars are available to Expo at runtime
. "$ProjectDir\load-env.ps1"

# Kill any process holding the Expo port to avoid "port in use" prompts
$portProcess = netstat -ano | Select-String ":$Port " | Select-String "LISTENING"
if ($portProcess) {
    $portPid = ($portProcess -split '\s+')[-1]
    Write-Host "Freeing port $Port (PID $portPid)..." -ForegroundColor Yellow
    Stop-Process -Id $portPid -Force -ErrorAction SilentlyContinue
}

# Start Proxy Server in a separate window so it keeps running
Write-Host "Starting Proxy Server (CORS Bypass)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir'; node proxy-server.js"

# Brief wait for proxy to be ready
Start-Sleep -Seconds 2

# Launch Expo Web in Chromium
Write-Host "Launching Expo Web on port $Port in Chromium..." -ForegroundColor Cyan
Set-Location $ProjectDir
# BROWSER=chrome tells Expo to auto-open Chrome/Chromium when Metro is ready
$env:BROWSER = "chrome"
npx expo start --web --port $Port
