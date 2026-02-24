# setup-android-env.ps1
# Automates the setup of the Android Command Line Tools, Java JDK, and the Emulator

$ErrorActionPreference = "Stop"

$JavaDir = "C:\java"
$SdkDir = "C:\android\sdk"
$CmdLineToolsZip = "$SdkDir\cmdline-tools.zip"
$JdkZip = "C:\openjdk-17.zip"

Write-Host "--- Sentient UI: Android Environment Setup ---" -ForegroundColor Cyan

# 1. Setup Java 17
if (!(Test-Path "$JavaDir\jdk-17.0.10+7\bin\java.exe")) {
    Write-Host "Downloading OpenJDK 17..."
    Invoke-WebRequest -Uri "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.10_7.zip" -OutFile $JdkZip
    Write-Host "Extracting OpenJDK 17 to $JavaDir..."
    Expand-Archive -Path $JdkZip -DestinationPath $JavaDir -Force
    Remove-Item $JdkZip -Force
} else {
    Write-Host "OpenJDK 17 already installed."
}

# Set transient Env Vars for this script
$env:JAVA_HOME = "$JavaDir\jdk-17.0.10+7"
$env:Path += ";$env:JAVA_HOME\bin"

# 2. Setup Android SDK Command Line Tools
if (!(Test-Path "$SdkDir\cmdline-tools\latest\bin\sdkmanager.bat")) {
    New-Item -ItemType Directory -Force -Path "$SdkDir\cmdline-tools" | Out-Null
    Write-Host "Downloading Android SDK Command Line tools..."
    # The URL may change, replace with latest from developer.android.com/studio#command-tools
    curl.exe -L -o $CmdLineToolsZip "https://dl.google.com/android/repository/commandlinetools-win-14742923_latest.zip"
    
    Write-Host "Extracting Command Line tools..."
    Expand-Archive -Path $CmdLineToolsZip -DestinationPath "$SdkDir\cmdline-tools" -Force
    Remove-Item $CmdLineToolsZip -Force
    
    # Rename 'cmdline-tools' folder inside to 'latest'
    Rename-Item -Path "$SdkDir\cmdline-tools\cmdline-tools" -NewName "latest" -Force
} else {
    Write-Host "Android Command Line Tools already installed."
}

# 3. Setup Environment Variables persistently
Write-Host "Configuring System Environment Variables..."
setx ANDROID_HOME $SdkDir /M
setx ANDROID_SDK_ROOT $SdkDir /M
setx JAVA_HOME $env:JAVA_HOME /M

# Add to PATH securely if not exists
$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$PathsToAdd = @(
    "$env:JAVA_HOME\bin",
    "$SdkDir\cmdline-tools\latest\bin",
    "$SdkDir\platform-tools",
    "$SdkDir\emulator"
)
foreach ($P in $PathsToAdd) {
    if ($CurrentPath -notmatch [regex]::Escape($P)) {
        $CurrentPath += ";$P"
    }
}
[Environment]::SetEnvironmentVariable("Path", $CurrentPath, "Machine")

# Set transient Env Vars for the rest of this session
$env:ANDROID_HOME = $SdkDir
$env:ANDROID_SDK_ROOT = $SdkDir
$env:Path = $CurrentPath

# 4. Accept Licenses and Install SDK Packages
Write-Host "Installing Android Platforms, Build Tools, and Emulator..."
echo y | & "$SdkDir\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools" "platforms;android-34" "build-tools;34.0.0" "emulator" "system-images;android-34;google_apis;x86_64"

# 5. Create Android Virtual Device (AVD)
Write-Host "Creating Android Virtual Device 'SentientUI'..."
$AvdExists = & "$SdkDir\cmdline-tools\latest\bin\avdmanager.bat" list avd | Select-String "Name: SentientUI"
if (!$AvdExists) {
    echo no | & "$SdkDir\cmdline-tools\latest\bin\avdmanager.bat" create avd -n SentientUI -k "system-images;android-34;google_apis;x86_64" --device "pixel"
} else {
    Write-Host "AVD SentientUI already exists."
}

Write-Host "Setup Complete! You may need to restart your terminal for PATH changes to take full effect." -ForegroundColor Green
Write-Host "You can now run 'npm run android' or open the emulator using '$SdkDir\emulator\emulator.exe -avd SentientUI'" -ForegroundColor Cyan
