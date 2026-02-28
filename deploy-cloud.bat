@echo off
echo [Cloud Sync] Starting deployment sequence...

:: 1. Locate Functions Directory
if exist "functions" (
    cd functions
) else if exist "..\functions" (
    cd ..\functions
) else if exist "c:\functions" (
    cd /d c:\functions
) else (
    echo [Error] Could not find 'functions' directory.
    echo Please ensure your Firebase Functions are located in 'functions' or 'c:\functions'.
    exit /b 1
)

:: 2. Build TypeScript
echo [Cloud Sync] Building TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Build failed.
    exit /b %ERRORLEVEL%
)

:: 3. Deploy to Firebase
echo [Cloud Sync] Deploying to Firebase...
call firebase deploy --only functions
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Deployment failed.
    exit /b %ERRORLEVEL%
)

echo [Cloud Sync] Success! Logic is 100%% in the cloud.
exit /b 0