# run-web.ps1
# Automates starting the proxy-server and the Expo web server

$ErrorActionPreference = "Stop"

Write-Host "--- Sentient UI: Web Launcher ---" -ForegroundColor Cyan

# 1. Start Proxy Server in a new window
Write-Host "Starting Proxy Server (CORS Bypass)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run proxy"

# 2. Wait a moment for proxy to initialize
Start-Sleep -Seconds 2

# 3. Start Expo Web
Write-Host "Launching Expo Web..." -ForegroundColor Cyan
npm run web
