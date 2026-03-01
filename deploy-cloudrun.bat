@echo off
:: ============================================================
:: deploy-cloudrun.bat — Build + Deploy the Sentient Proxy
:: Usage:  deploy-cloudrun.bat [build|deploy|status|all]
::   build   — Submit Docker build to Cloud Build (async)
::   deploy  — Deploy the latest image to Cloud Run
::   status  — Check recent Cloud Build status
::   all     — Build (wait) then deploy  (default)
:: ============================================================

:: Kill conda env vars so gcloud doesn't get interrupted
set CONDA_EXE=
set CONDA_DEFAULT_ENV=
set CONDA_PREFIX=
set CONDA_SHLVL=
set _CE_M=
set _CE_CONDA=

:: Why: Windows shell sessions don't inherit .env — load it explicitly so API keys
:: are never deployed as empty strings which causes silent 403 failures in Cloud Run.
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-Content .env | Where-Object { $_ -match '^EXPO_PUBLIC_GEMINI_API_KEY=' } | ForEach-Object { ($_ -split '=', 2)[1] }"') do set EXPO_PUBLIC_GEMINI_API_KEY=%%i
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-Content .env | Where-Object { $_ -match '^GOOGLE_API_KEY=' } | ForEach-Object { ($_ -split '=', 2)[1] }"') do set GOOGLE_API_KEY=%%i
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-Content .env | Where-Object { $_ -match '^PROXY_API_KEY=' } | ForEach-Object { ($_ -split '=', 2)[1] }"') do set PROXY_API_KEY=%%i

set GCLOUD="C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
set PROJECT=sentient-ai-browser
set REGION=us-central1
set SERVICE=sentient-proxy
set IMAGE=gcr.io/%PROJECT%/%SERVICE%
set FUNCS_DIR=%~dp0functions

if "%1"=="" goto all
if "%1"=="build"  goto build
if "%1"=="deploy" goto deploy
if "%1"=="status" goto status
if "%1"=="all"    goto all

echo Unknown command: %1
echo Usage: deploy-cloudrun.bat [build^|deploy^|status^|all]
exit /b 1

:: ----- BUILD (async — won't get killed by terminal signals) -----
:build
echo.
echo === [1/2] Building container via Cloud Build ===
echo Image: %IMAGE%
echo Source: %FUNCS_DIR%
echo.
call %GCLOUD% builds submit --tag %IMAGE% "%FUNCS_DIR%" --project %PROJECT% --async
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cloud Build submit failed.
    exit /b %ERRORLEVEL%
)
echo.
echo Build submitted. Run "deploy-cloudrun.bat status" to check progress.
echo Once it says SUCCESS, run "deploy-cloudrun.bat deploy".
goto :eof

:: ----- DEPLOY (uses whatever image is in GCR) -----
:deploy
echo.
echo === [2/2] Deploying %SERVICE% to Cloud Run ===
call %GCLOUD% run deploy %SERVICE% ^
    --image %IMAGE% ^
    --platform managed ^
    --region %REGION% ^
    --project %PROJECT% ^
    --allow-unauthenticated ^
    --memory 2Gi ^
    --cpu 1 ^
    --timeout 300 ^
    --min-instances 0 ^
    --max-instances 2 ^
    --set-env-vars "NODE_ENV=production,GOOGLE_API_KEY=%GOOGLE_API_KEY%,EXPO_PUBLIC_GEMINI_API_KEY=%EXPO_PUBLIC_GEMINI_API_KEY%,PROXY_API_KEY=%PROXY_API_KEY%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cloud Run deploy failed.
    exit /b %ERRORLEVEL%
)
echo.
echo === Getting service URL ===
call %GCLOUD% run services describe %SERVICE% --platform managed --region %REGION% --project %PROJECT% --format "value(status.url)"
echo.
echo Deploy complete! Update shared/env.utils.ts productionProxy with the URL above.
goto :eof

:: ----- STATUS -----
:status
echo.
echo === Recent Cloud Builds ===
call %GCLOUD% builds list --project=%PROJECT% --limit=5 --format="table(id,status,startTime,duration,images)"
goto :eof

:: ----- ALL (build synchronously, then deploy) -----
:all
echo.
echo === Full Deploy: Build + Deploy ===
echo Image: %IMAGE%
echo.
call %GCLOUD% builds submit --tag %IMAGE% "%FUNCS_DIR%" --project %PROJECT%
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cloud Build failed. Aborting deploy.
    exit /b %ERRORLEVEL%
)
echo.
echo Build succeeded. Deploying...
goto deploy
