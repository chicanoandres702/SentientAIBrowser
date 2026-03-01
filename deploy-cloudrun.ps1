# deploy-cloudrun.ps1
# Automates the container build and deployment to Google Cloud Run for the Sentient Proxy.

$ErrorActionPreference = "Stop"
$ProjectID = "sentient-ai-browser"
$Region = "us-central1"
$ServiceName = "sentient-proxy"
$ImageName = "gcr.io/$ProjectID/$ServiceName"

Write-Host "--- Sentient UI: Cloud Run Deployment ---" -ForegroundColor Cyan

# Why: keep runtime secrets out of source code and ensure Cloud Run always has a Gemini key.
$EnvPath = Join-Path $PSScriptRoot ".env"
$GeminiKey = $env:GOOGLE_API_KEY
$PublicGeminiKey = $env:EXPO_PUBLIC_GEMINI_API_KEY
$ProxyApiKey = $env:PROXY_API_KEY
if (Test-Path $EnvPath) {
    foreach ($line in Get-Content $EnvPath) {
        if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
        $parts = $line.Split('=', 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        if (-not $PublicGeminiKey -and $name -eq 'EXPO_PUBLIC_GEMINI_API_KEY') { $PublicGeminiKey = $value }
        if (-not $GeminiKey -and $name -eq 'GOOGLE_API_KEY') { $GeminiKey = $value }
        if (-not $ProxyApiKey -and $name -eq 'PROXY_API_KEY') { $ProxyApiKey = $value }
    }
}
if (-not $GeminiKey) { $GeminiKey = $PublicGeminiKey }
if (-not $PublicGeminiKey) { $PublicGeminiKey = $GeminiKey }
if (-not $GeminiKey) {
    throw "Missing Gemini API key. Set GOOGLE_API_KEY or EXPO_PUBLIC_GEMINI_API_KEY in environment or .env."
}

# Ensure we are in the functions directory context for building
$FunctionsDir = Join-Path $PSScriptRoot "functions"

$GCloudPath = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

# 1. Build and push image to Google Container Registry via Cloud Build
Write-Host "Building and pushing container image to GCR..." -ForegroundColor Yellow
& $GCloudPath builds submit --tag $ImageName $FunctionsDir --project $ProjectID

# 2. Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
& $GCloudPath run deploy $ServiceName `
    --image $ImageName `
    --platform managed `
    --region $Region `
    --project $ProjectID `
    --allow-unauthenticated `
    --memory 1Gi `
    --cpu 1 `
    --timeout 300 `
    --min-instances 0 `
    --max-instances 2 `
    --set-env-vars "NODE_ENV=production,GOOGLE_API_KEY=$GeminiKey,EXPO_PUBLIC_GEMINI_API_KEY=$PublicGeminiKey,PROXY_API_KEY=$ProxyApiKey"

Write-Host "--- Deployment Complete ---" -ForegroundColor Green
$ServiceUrl = & $GCloudPath run services describe $ServiceName --platform managed --region $Region --project $ProjectID --format 'value(status.url)'
Write-Host "Service URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host "Update your EXPO_PUBLIC_PROXY_URL in .env to use this URL."
