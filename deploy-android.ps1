function Get-AndroidDeviceId {
    $adbOutput = adb devices | Select-String -Pattern 'device$'
    $lines = $adbOutput | ForEach-Object { $_.ToString() }
    $ids = @()
    foreach ($line in $lines) {
        if ($line -match '^(.*?)\s+device$') {
            $ids += $Matches[1]
        }
    }
    if ($ids.Count -eq 0) {
        Write-Error "No Android devices found via ADB."
        exit 1
    } elseif ($ids.Count -eq 1) {
        return $ids[0]
    } else {
        Write-Host "Multiple devices detected:"
        for ($i=0; $i -lt $ids.Count; $i++) {
            Write-Host "$($i+1): $($ids[$i])"
        }
        $choice = Read-Host "Select device number"
        $idx = [int]$choice - 1
        if ($idx -ge 0 -and $idx -lt $ids.Count) {
            return $ids[$idx]
        } else {
            Write-Error "Invalid selection."
            exit 1
        }
    }
}

function BuildLocalAndroid {
    $deviceId = Get-AndroidDeviceId
    Write-Host "Using Android device: $deviceId"

    # Start Metro bundler on port 8081 if not already running
    $metroPort = 8081
    $metroStatus = netstat -ano | Select-String ":$metroPort"
    if (-not $metroStatus) {
        Write-Host "Starting Metro bundler on port $metroPort..."
        Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c npx react-native start --port $metroPort"
        Start-Sleep -Seconds 5
    } else {
        Write-Host "Metro already running on port $metroPort."
    }

    # Set up ADB reverse for Metro dev server on port 8081
    adb -s "$deviceId" reverse tcp:8081 tcp:8081

    # Install APK (update path if needed)
    $apkPath = "android/app/build/outputs/apk/debug/app-debug.apk"
    if (Test-Path $apkPath) {
        Write-Host "Installing APK: $apkPath"
        adb -s "$deviceId" install -r $apkPath
    } else {
        Write-Host "APK not found at $apkPath. Please build the release APK first."
    }
    Write-Host 'Submitted to Play Store'
}

BuildLocalAndroid
Write-Host "Android deploy complete!"