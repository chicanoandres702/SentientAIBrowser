# load-env.ps1
# Loads environment variables from .env into the process environment.
# Note: Firebase public config is now hardcoded in the source for simplicity.

$EnvFile = ".env"
if (Test-Path $EnvFile) {
    Write-Host "[load-env] Loading variables from $EnvFile..." -ForegroundColor DarkYellow
    Get-Content $EnvFile | ForEach-Object {
        # Skip comments and empty lines
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*"?([^"#]*)"?\s*$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}
Write-Host "[load-env] Done." -ForegroundColor DarkYellow
