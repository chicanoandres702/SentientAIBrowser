# AIDDE TRACE HEADER
# Build script for containerized Android app build (Windows PowerShell)
# Why: Automate Docker build and run for Android APK output on Windows

# Build the container
# Usage: .\build-android-container.ps1

docker build -f Dockerfile.android -t sentient-android-build .

docker run --rm -v "$PWD\app\build\outputs:/app/android-build" sentient-android-build

Write-Host "Android build output is in .\app\build\outputs (inside android-build volume)"
