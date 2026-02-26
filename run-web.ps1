# run-web.ps1
# Loads .env, starts proxy server in background, launches Expo web dev server.

$ErrorActionPreference = "Stop"
$Port = 8081
$ProjectDir = $PSScriptRoot

Write-Host "--- Sentient UI: Web Launcher ---" -ForegroundColor Cyan

# Sanitize .env file to prevent Expo from injecting literal double quotes (auth/invalid-api-key)
if (Test-Path "$ProjectDir\.env") {
    Write-Host "[load-env] Sanitizing variables in .env..." -ForegroundColor DarkYellow
    $content = Get-Content "$ProjectDir\.env"
    $content = $content | ForEach-Object { $_ -replace '"', '' }
    $content | Set-Content "$ProjectDir\.env"
}

# Load .env so EXPO_PUBLIC_ vars are available to Expo at runtime
Write-Host "[load-env] Loading variables from .env..." -ForegroundColor Yellow
. "$ProjectDir\load-env.ps1"

# Kill any process holding the Expo port to avoid "port in use" prompts
$portProcess = netstat -ano | Select-String ":$Port " | Select-String "LISTENING"
if ($portProcess) {
    $portPid = ($portProcess -split '\s+')[-1]
    Write-Host "Freeing port $Port (PID $portPid)..." -ForegroundColor Yellow
    Stop-Process -Id $portPid -Force -ErrorAction SilentlyContinue
}

# Launch Expo Web in Chromium
Write-Host "Launching Expo Web on port $Port in Chromium..." -ForegroundColor Cyan
Set-Location $ProjectDir
$env:BROWSER = "chrome"
npx expo start -c --web --port $Port
