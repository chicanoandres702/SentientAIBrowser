# Android Full Automation Launch Script
# Usage: powershell -ExecutionPolicy Bypass -File .\launch-android-build.ps1

$ErrorActionPreference = 'Stop'

Write-Host "[1/6] Building APK..." -ForegroundColor Cyan
npm run android

$apkPath = "android/app/build/outputs/apk/release/app-release-unsigned.apk"
if (!(Test-Path $apkPath)) {
    Write-Host "APK not found: $apkPath" -ForegroundColor Red
    exit 1
}

$keystore = "my-release-key.keystore"
$keyalias = "my-key-alias"
$storepass = "password123"
$keypass = "password123"

if (!(Test-Path $keystore)) {
    Write-Host "[2/6] Generating keystore..." -ForegroundColor Cyan
    & keytool -genkey -v -keystore $keystore -alias $keyalias -keyalg RSA -keysize 2048 -validity 10000 -storepass $storepass -keypass $keypass -dname "CN=SentientAI, OU=Dev, O=SentientAI, L=World, S=Earth, C=US"
}

Write-Host "[3/6] Signing APK..." -ForegroundColor Cyan
& jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore $keystore -storepass $storepass -keypass $keypass $apkPath $keyalias

$alignedApk = "android/app/build/outputs/apk/release/app-release.apk"
Write-Host "[4/6] Aligning APK..." -ForegroundColor Cyan
& zipalign -v 4 $apkPath $alignedApk

Write-Host "[5/6] Installing APK to device..." -ForegroundColor Cyan
& adb install -r $alignedApk

Write-Host "[6/6] Done!" -ForegroundColor Green