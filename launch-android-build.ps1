# Android Full Automation Launch Script
# Usage: powershell -ExecutionPolicy Bypass -File .\launch-android-build.ps1

$ErrorActionPreference = 'Stop'


Write-Host "[1/6] Building APK with full warnings and stacktrace..." -ForegroundColor Cyan
cd android
./gradlew assembleRelease --warning-mode all --stacktrace
cd ..

## Use unsigned APK as input, signed APK as output
$unsignedApkPath = "android/app/build/outputs/apk/release/app-release-unsigned.apk"
$signedApkPath = "android/app/build/outputs/apk/release/app-release-signed.apk"
if (!(Test-Path $unsignedApkPath)) {
    Write-Host "APK not found: $unsignedApkPath" -ForegroundColor Red
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

    Write-Host "[3/6] Signing APK (APK Signature Scheme v2)..." -ForegroundColor Cyan
        $ApkSignerPath = "C:\android\sdk\build-tools\34.0.0\apksigner.bat"
        if (-not (Test-Path $ApkSignerPath)) {
            Write-Host "apksigner.bat not found at $ApkSignerPath! Please check your Build-Tools installation." -ForegroundColor Red
            exit 1
        }
        # Sign APK with v2 signature
        & $ApkSignerPath sign --ks $keystore --ks-key-alias $keyalias --ks-pass pass:$storepass --key-pass pass:$keypass --out $signedApkPath $unsignedApkPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: APK signing (v2) failed." -ForegroundColor Red
        exit 1
    }
    Write-Host "APK signed with APK Signature Scheme v2." -ForegroundColor Green


## Align the signed APK to a new file
$alignedApk = "android/app/build/outputs/apk/release/app-release-aligned.apk"
Write-Host "[4/6] Aligning APK..." -ForegroundColor Cyan
# Try to find zipalign.exe in common Android SDK locations
$zipalign = $null
$sdkPaths = @(
    "$env:ANDROID_HOME",
    "$env:ANDROID_SDK_ROOT",
    "$env:LOCALAPPDATA\Android\Sdk"
)
foreach ($sdk in $sdkPaths) {
    if ($sdk -and (Test-Path $sdk)) {
        $buildTools = Get-ChildItem -Path "$sdk\build-tools" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
        foreach ($ver in $buildTools) {
            $candidate = "$($ver.FullName)\zipalign.exe"
            if (Test-Path $candidate) {
                $zipalign = $candidate
                break
            }
        }
    }
    if ($zipalign) { break }
}
if (-not $zipalign) {
    Write-Host "zipalign.exe not found! Please install Android SDK Build-Tools and set ANDROID_HOME or ANDROID_SDK_ROOT." -ForegroundColor Red
    exit 1
}
& $zipalign -v 4 $unsignedApkPath $alignedApk

# Now sign the aligned APK
Write-Host "[4/6] Signing aligned APK (APK Signature Scheme v2)..." -ForegroundColor Cyan
$signedAlignedApk = "android/app/build/outputs/apk/release/app-release-signed-aligned.apk"
$ApkSignerPath = "C:\android\sdk\build-tools\34.0.0\apksigner.bat"
if (-not (Test-Path $ApkSignerPath)) {
    Write-Host "apksigner.bat not found at $ApkSignerPath! Please check your Build-Tools installation." -ForegroundColor Red
    exit 1
}
& $ApkSignerPath sign --ks $keystore --ks-key-alias $keyalias --ks-pass pass:$storepass --key-pass pass:$keypass --out $signedAlignedApk $alignedApk
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: APK signing (v2) failed." -ForegroundColor Red
    exit 1
}
Write-Host "APK signed with APK Signature Scheme v2." -ForegroundColor Green

Write-Host "[5/6] Installing APK to device..." -ForegroundColor Cyan
& adb install -r $signedAlignedApk

Write-Host "[6/6] Done!" -ForegroundColor Green