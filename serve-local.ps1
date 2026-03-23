# serve-local.ps1
# Exports the Expo web build to dist/ and starts a local HTTP server on port 3000.
# On Android: connect device to same WiFi, open browser to http://<YOUR_PC_IP>:3000
# Or tunnel with: npx localtunnel --port 3000

param(
    [int]   $Port    = 3000,
    [switch]$NoBuild
)

$ErrorActionPreference = 'Stop'
function Write-Step { param($n,$t) Write-Host "`n[$n] $t" -ForegroundColor Cyan }
function Write-Ok   { param($m)    Write-Host "  + $m" -ForegroundColor Green }
function Write-Warn { param($m)    Write-Host "  ! $m" -ForegroundColor Yellow }

Set-Location $PSScriptRoot

# ---- 1. Build web bundle (skip if --NoBuild) ---------------------------------
if (-not $NoBuild) {
    Write-Step '1' 'Exporting Expo web bundle to ./dist'
    npx expo export --platform web --output-dir dist
    if ($LASTEXITCODE -ne 0) { Write-Host "Export failed" -ForegroundColor Red; exit 1 }
    Write-Ok 'Bundle exported'
} else {
    Write-Warn 'Skipping build (--NoBuild)'
}

# ---- 2. Ensure a static file server is available ----------------------------
Write-Step '2' 'Ensuring serve is available'
if (-not (Get-Command serve -ErrorAction SilentlyContinue)) {
    npm install -g serve
}
Write-Ok 'serve ready'

# ---- 3. Print LAN IP for device access --------------------------------------
Write-Step '3' 'LAN access URL'
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias '*Wi-Fi*','*Ethernet*' -ErrorAction SilentlyContinue |
       Where-Object { $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1).IPAddress
if ($ip) { Write-Ok "Open on device: http://${ip}:${Port}" }

# ---- 4. Start server --------------------------------------------------------
Write-Step '4' "Serving ./dist on http://localhost:$Port (Ctrl+C to stop)"
serve dist --listen $Port --single
