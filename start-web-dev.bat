@echo off
REM Quick Start Script for Sentient AI Browser - Web Development
REM This script clears cache and starts the dev server with hot reload

echo.
echo ==========================================
echo   SENTIENT AI BROWSER - Web Dev Server
echo ==========================================
echo.

echo Clearing build cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo ✓ Cleared node_modules cache
)

if exist .expo (
    rmdir /s /q .expo
    echo ✓ Cleared .expo cache
)

if exist dist (
    rmdir /s /q dist
    echo ✓ Cleared dist folder
)

echo.
echo Starting Expo Web Dev Server...
echo Web app will open at: http://localhost:19006
echo.
echo Changes to .styles.ts files will hot reload automatically
echo Press Ctrl+C to stop the server
echo.

npm run web

pause
