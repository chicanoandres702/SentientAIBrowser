# PowerShell Script: Build, Sign, Align, and Upload APK to Google Drive
# Requirements:
# - Google Drive CLI (gdrive) installed and authenticated
# - Android SDK Build-Tools (zipalign, apksigner, jarsigner, keytool) in PATH
#
# Usage:
# powershell -ExecutionPolicy Bypass -File upload-signed-apk-to-drive.ps1

$apkDir = "android/app/build/outputs/apk/release"
$unsignedApk = "$apkDir/app-release-unsigned.apk"
$keystore = "$apkDir/my-release-key.keystore"
$alias = "my-key-alias"
$storepass = "password123"
$keypass = "password123"
$signedApk = "$apkDir/app-release-signed.apk"
$alignedApk = "$apkDir/app-release-signed-aligned.apk"

Write-Host "Building release APK..." -ForegroundColor Cyan
Invoke-Expression "cd android; ./gradlew assembleRelease"

if (!(Test-Path $unsignedApk)) {
    Write-Host "APK not found: $unsignedApk" -ForegroundColor Red
    exit 1
}

Write-Host "Generating new keystore..." -ForegroundColor Cyan
keytool -genkey -v -keystore $keystore -alias $alias -keyalg RSA -keysize 2048 -validity 10000 -storepass $storepass -keypass $keypass -dname "CN=SentientAI, OU=Dev, O=SentientAI, L=World, S=Earth, C=US"

Write-Host "Signing APK..." -ForegroundColor Cyan
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore $keystore -storepass $storepass -keypass $keypass $unsignedApk $alias

Write-Host "Aligning APK..." -ForegroundColor Cyan
zipalign -v 4 $unsignedApk $alignedApk

Write-Host "Uploading $alignedApk to Google Drive..." -ForegroundColor Cyan
$uploadResult = gdrive upload $alignedApk

if ($uploadResult -match "Id: ([a-zA-Z0-9_-]+)") {
    $fileId = $Matches[1]
    $link = "https://drive.google.com/uc?id=$fileId&export=download"
    Write-Host "APK uploaded! Download link:" -ForegroundColor Green
    Write-Host $link -ForegroundColor Yellow
} else {
    Write-Host "Upload failed. See gdrive output above." -ForegroundColor Red
    exit 1
}
