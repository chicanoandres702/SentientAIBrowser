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

# Start Proxy Server in a new window for stability in local dev
Write-Host "[orchestration] Starting Proxy Core..." -ForegroundColor Cyan
# Why: The command is wrapped in a script block that ends with `Read-Host`.
# This is the most robust way to force the new terminal window to stay open
# after the process finishes or crashes, allowing you to see any error output.
# We use `node --inspect-brk=0` to explicitly disable the debugger, preventing
# auto-attach behaviors that cause the process to exit prematurely.
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectDir'; node --inspect-brk=0 proxy-server.js; Read-Host 'Proxy process finished. Press Enter to close.'"

# Give the proxy server a moment to initialize before Expo tries to connect to it.
Start-Sleep -Seconds 5

# Launch Expo Web in Chromium
Write-Host "Launching Expo Web on port $Port in Chromium..." -ForegroundColor Cyan
Set-Location $ProjectDir
$env:BROWSER = "chrome"
npx expo start -c --web --port $Port
