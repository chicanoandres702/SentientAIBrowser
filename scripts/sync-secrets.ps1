# sync-secrets.ps1
# Automates setting GitHub Secrets from the local .env file.
# Requires GitHub CLI (gh) authenticated.

$EnvFile = ".env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "--- Syncing secrets from .env to GitHub ---" -ForegroundColor Cyan

# Load all .env variables into a hashtable
$vars = @{}
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+?)\s*=\s*"?([^"#]*)"?\s*$') {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim()
        $vars[$key] = $val
    }
}

# 1. Sync Standard Global Secrets
$GlobalSecrets = @(
    "GITHUB_PERSONAL_ACCESS_TOKEN",
    "GOOGLE_OAUTH_ACCESS_TOKEN",
    "GOOGLE_OAUTH_REFRESH_TOKEN",
    "GOOGLE_OAUTH_ID_TOKEN"
)

foreach ($key in $GlobalSecrets) {
    if ($vars.ContainsKey($key)) {
        Write-Host "Setting secret: $key" -ForegroundColor Yellow
        $vars[$key] | gh secret set $key
    }
}

# 2. Reconstruct and Sync Firebase Service Account JSON (Deployment)
if ($vars.ContainsKey("FIREBASE_SVC_PRIVATE_KEY")) {
    Write-Host "Reconstructing FIREBASE_SERVICE_ACCOUNT JSON..." -ForegroundColor Yellow
    
    $svcAccount = @{
        "type"                        = $vars["FIREBASE_SVC_TYPE"]
        "project_id"                  = $vars["FIREBASE_SVC_PROJECT_ID"]
        "private_key_id"              = $vars["FIREBASE_SVC_PRIVATE_KEY_ID"]
        "private_key"                 = $vars["FIREBASE_SVC_PRIVATE_KEY"].Replace('\n', "`n")
        "client_email"                = $vars["FIREBASE_SVC_CLIENT_EMAIL"]
        "client_id"                   = $vars["FIREBASE_SVC_CLIENT_ID"]
        "auth_uri"                    = $vars["FIREBASE_SVC_AUTH_URI"]
        "token_uri"                   = $vars["FIREBASE_SVC_TOKEN_URI"]
        "auth_provider_x509_cert_url" = $vars["FIREBASE_SVC_AUTH_PROVIDER_X509_CERT_URL"]
        "client_x509_cert_url"        = $vars["FIREBASE_SVC_CLIENT_X509_CERT_URL"]
        "universe_domain"             = $vars["FIREBASE_SVC_UNIVERSE_DOMAIN"]
    }
    
    $json = $svcAccount | ConvertTo-Json -Compress
    $json | gh secret set FIREBASE_SERVICE_ACCOUNT
    Write-Host "FIREBASE_SERVICE_ACCOUNT successfully synced." -ForegroundColor Green
}

Write-Host ""
Write-Host "Sync complete!" -ForegroundColor Green
