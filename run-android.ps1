# run-android.ps1
# Sets up Java/Android SDK paths, boots the emulator if needed, then launches Expo for Android.

$ErrorActionPreference = "Stop"
$ProjectDir   = $PSScriptRoot
$JavaDir      = "C:\java"
$SdkDir       = "C:\android\sdk"
$ExpoPort     = 8081
$AvdName      = "SentientUI"

# --- Environment ---
$env:JAVA_HOME         = "$JavaDir\jdk-17.0.10+7"
$env:ANDROID_HOME      = $SdkDir
$env:ANDROID_SDK_ROOT  = $SdkDir
$MachinePath           = [Environment]::GetEnvironmentVariable("Path", "Machine")
$env:Path              = "$MachinePath;$env:JAVA_HOME\bin;$SdkDir\cmdline-tools\latest\bin;$SdkDir\platform-tools;$SdkDir\emulator"

Write-Host "--- Sentient UI: Android Launcher ---" -ForegroundColor Cyan

# Kill any process holding the Expo port
$portProcess = netstat -ano | Select-String ":$ExpoPort " | Select-String "LISTENING"
if ($portProcess) {
    $pid = ($portProcess -split '\s+')[-1]
    Write-Host "Freeing port $ExpoPort (PID $pid)..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

# Start ADB server
& "$SdkDir\platform-tools\adb.exe" start-server

# Check if emulator is already running
$devices = & "$SdkDir\platform-tools\adb.exe" devices
if ($devices -match "emulator-\d+\s+device") {
    Write-Host "Emulator already running." -ForegroundColor Green
} else {
    Write-Host "Starting Android Emulator ($AvdName)..." -ForegroundColor Yellow
    Start-Process -FilePath "$SdkDir\emulator\emulator.exe" `
        -ArgumentList "-avd $AvdName -no-snapshot-save -no-boot-anim -gpu swiftshader_indirect"

    Write-Host "Waiting for device to boot (60-90s on first start)..."
    & "$SdkDir\platform-tools\adb.exe" wait-for-device

    $booted = $false
    while (-not $booted) {
        Start-Sleep -Seconds 5
        $prop = & "$SdkDir\platform-tools\adb.exe" shell getprop sys.boot_completed 2>$null
        if ($prop.Trim() -eq "1") { $booted = $true }
    }

    Write-Host "Device booted." -ForegroundColor Green
    Start-Sleep -Seconds 3
    & "$SdkDir\platform-tools\adb.exe" shell input keyevent 66
}

# Start Proxy in a labeled background window
Write-Host "Starting Proxy Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$ProjectDir'; node proxy-server.js" `
    -WindowStyle Normal

Start-Sleep -Seconds 2

# Launch Expo for Android
Write-Host "Launching Expo (Android) on port $ExpoPort..." -ForegroundColor Cyan
Set-Location $ProjectDir
$env:EXPO_OFFLINE = 0
npx expo start --android --port $ExpoPort

