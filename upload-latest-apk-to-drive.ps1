# PowerShell Script: Build and Upload Latest APK to Google Drive
# Requirements:
# - Google Drive CLI (gdrive) installed and authenticated
#
# Usage:
# powershell -ExecutionPolicy Bypass -File upload-latest-apk-to-drive.ps1

$apkDir = "android/app/build/outputs/apk/release"
$buildCmd = "cd android; ./gradlew assembleRelease"

Write-Host "Building release APK..." -ForegroundColor Cyan
Invoke-Expression $buildCmd

# Find the latest APK file in the release folder
$latestApk = Get-ChildItem -Path $apkDir -Filter *.apk | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($null -eq $latestApk) {
    Write-Host "No APK found in $apkDir" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading $($latestApk.Name) to Google Drive..." -ForegroundColor Cyan
$uploadResult = gdrive upload $latestApk.FullName

if ($uploadResult -match "Id: ([a-zA-Z0-9_-]+)") {
    $fileId = $Matches[1]
    $link = "https://drive.google.com/uc?id=$fileId&export=download"
    Write-Host "APK uploaded! Download link:" -ForegroundColor Green
    Write-Host $link -ForegroundColor Yellow
} else {
    Write-Host "Upload failed. See gdrive output above." -ForegroundColor Red
    exit 1
}
