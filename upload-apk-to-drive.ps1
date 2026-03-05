# PowerShell Script: Build and Upload APK to Google Drive
# Requirements:
# - Google Drive CLI (gdrive) installed: https://github.com/prasmussen/gdrive
# - You must authenticate gdrive with your Google account (run 'gdrive about' to set up)
#
# Usage:
# 1. Save this script as upload-apk-to-drive.ps1
# 2. Run in project root: powershell -ExecutionPolicy Bypass -File upload-apk-to-drive.ps1

$apkPath = "android/app/build/outputs/apk/release/app-release-signed-aligned.apk"
$buildCmd = "cd android; ./gradlew assembleRelease"

Write-Host "Building release APK..." -ForegroundColor Cyan
Invoke-Expression $buildCmd

if (!(Test-Path $apkPath)) {
    Write-Host "APK not found: $apkPath" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading APK to Google Drive..." -ForegroundColor Cyan
# Upload to root folder; you can specify a folder ID with -p <folderId>
$uploadResult = gdrive upload "$apkPath"

if ($uploadResult -match "Id: ([a-zA-Z0-9_-]+)") {
    $fileId = $Matches[1]
    $link = "https://drive.google.com/uc?id=$fileId&export=download"
    Write-Host "APK uploaded! Download link:" -ForegroundColor Green
    Write-Host $link -ForegroundColor Yellow
} else {
    Write-Host "Upload failed. See gdrive output above." -ForegroundColor Red
    exit 1
}
