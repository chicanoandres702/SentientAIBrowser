# build-web.ps1
# Builds the Expo web app for Firebase Hosting deployment.
# Output goes to the /dist folder.

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot

Write-Host "--- Sentient UI: Build Web ---" -ForegroundColor Cyan
Set-Location $ProjectDir

Write-Host "Clearing previous build..." -ForegroundColor Yellow
if (Test-Path "$ProjectDir\dist") { Remove-Item -Recurse -Force "$ProjectDir\dist" }

Write-Host "Building for web (Expo export)..." -ForegroundColor Green
npx expo export --platform web

Write-Host ""
Write-Host "Build complete -> dist/" -ForegroundColor Green
Write-Host "Deploy with: firebase deploy --only hosting" -ForegroundColor Cyan
