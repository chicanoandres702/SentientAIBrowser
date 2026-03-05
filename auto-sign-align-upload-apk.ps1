# PowerShell Script: Auto-detect Latest APK, Sign, Align, and Upload to Google Drive
# Requirements:
# - Google Drive CLI (gdrive) installed and authenticated
# - Android SDK Build-Tools (zipalign, jarsigner, keytool) in PATH
#
# Usage:
# powershell -ExecutionPolicy Bypass -File auto-sign-align-upload-apk.ps1

$apkRoot = "android/app/build/outputs/apk"
$latestUnsignedApk = Get-ChildItem -Path $apkRoot -Recurse -Filter *-unsigned.apk | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($null -eq $latestUnsignedApk) {
    Write-Host "No unsigned APK found in $apkRoot or subfolders." -ForegroundColor Red
    exit 1
}

$apkDir = $latestUnsignedApk.DirectoryName
$keystore = "$apkDir/my-release-key.keystore"
$alias = "my-key-alias"
$storepass = "password123"
$keypass = "password123"
$signedApk = "$apkDir/app-release-signed.apk"
$alignedApk = "$apkDir/app-release-signed-aligned.apk"

Write-Host "Generating new keystore..." -ForegroundColor Cyan
keytool -genkey -v -keystore $keystore -alias $alias -keyalg RSA -keysize 2048 -validity 10000 -storepass $storepass -keypass $keypass -dname "CN=SentientAI, OU=Dev, O=SentientAI, L=World, S=Earth, C=US"

Write-Host "Signing APK: $($latestUnsignedApk.FullName)" -ForegroundColor Cyan
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore $keystore -storepass $storepass -keypass $keypass -signedjar $signedApk $latestUnsignedApk.FullName $alias


Write-Host "Aligning signed APK..." -ForegroundColor Cyan
$zipalignPath = "C:\android\sdk\build-tools\36.0.0\zipalign.exe"
$zipalignResult = & $zipalignPath -v 4 $signedApk $alignedApk
if (!(Test-Path $alignedApk)) {
    Write-Host "Alignment failed: $alignedApk not found." -ForegroundColor Red
    Write-Host $zipalignResult
    exit 1
}

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
