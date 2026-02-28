@echo off
echo [Local Cloud] Starting Firebase Emulator...

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
echo [Local Cloud] Building TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Build failed.
    exit /b %ERRORLEVEL%
)

:: 3. Start Emulator
echo [Local Cloud] Starting Emulator Suite...
call firebase emulators:start
if %ERRORLEVEL% NEQ 0 (
    echo [Error] Emulator failed to start.
    exit /b %ERRORLEVEL%
)

exit /b 0