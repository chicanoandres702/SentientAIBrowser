# load-env.ps1
# Shared helper: parses .env and sets EXPO_PUBLIC_ (and all) vars
# as process-level environment variables before any Expo/Node command.
# Usage: . "$PSScriptRoot\load-env.ps1"

$EnvFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $EnvFile)) {
    Write-Host "[load-env] No .env file found, skipping." -ForegroundColor DarkGray
    return
}

Write-Host "[load-env] Loading $EnvFile..." -ForegroundColor DarkYellow
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+?)\s*=\s*"?([^"#]*)"?\s*$') {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}
Write-Host "[load-env] Done." -ForegroundColor DarkYellow
