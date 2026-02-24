# run-android.ps1
# Streamlined script to set paths, launch the emulator, and start the app natively on Android

$ErrorActionPreference = "Stop"

$JavaDir = "C:\java"
$SdkDir = "C:\android\sdk"

# 1. Set Environment Variables
$env:JAVA_HOME = "$JavaDir\jdk-17.0.10+7"
$env:ANDROID_HOME = $SdkDir
$env:ANDROID_SDK_ROOT = $SdkDir

# Combine with Machine Path
$MachinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$env:Path = "$MachinePath;$env:JAVA_HOME\bin;$SdkDir\cmdline-tools\latest\bin;$SdkDir\platform-tools;$SdkDir\emulator"

Write-Host "--- Sentient UI: Android Launcher ---" -ForegroundColor Cyan

# 2. Check if ADB is working
& "$SdkDir\platform-tools\adb.exe" start-server

# 3. Start Emulator if no devices attached
$devices = & "$SdkDir\platform-tools\adb.exe" devices
if ($devices -match "emulator-\d+\s+device") {
    Write-Host "Emulator is already running." -ForegroundColor Green
}
else {
    Write-Host "Starting Android Emulator (SentientUI)..." -ForegroundColor Yellow
    
    # Start the emulator quietly in the background
    Start-Process -FilePath "$SdkDir\emulator\emulator.exe" -ArgumentList "-avd SentientUI -no-snapshot-save -no-boot-anim"

    Write-Host "Waiting for Android to boot (this may take a minute)..."
    
    # Wait for device to connect
    & "$SdkDir\platform-tools\adb.exe" wait-for-device
    
    $booted = $false
    while (-not $booted) {
        Start-Sleep -Seconds 5
        $prop = & "$SdkDir\platform-tools\adb.exe" shell getprop sys.boot_completed
        if ($prop -match "1") {
            $booted = $true
        }
    }
    
    Write-Host "Device booted successfully!" -ForegroundColor Green
    
    # Give the UI a few seconds to display before trying to dismiss any warnings
    Start-Sleep -Seconds 5
    
    # Try to press Enter (KEYCODE_ENTER = 66) to dismiss the ADB warning dialog if it's focused
    & "$SdkDir\platform-tools\adb.exe" shell input keyevent 66
}

# 4. Start the Application
Write-Host "Starting Proxy Server (CORS Bypass) in background..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "npm run proxy" -WindowStyle Hidden

Write-Host "Launching Expo bundler for Android..." -ForegroundColor Cyan
$env:EXPO_OFFLINE = 1
npm run android
