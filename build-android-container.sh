# AIDDE TRACE HEADER
# Build script for containerized Android app build
# Why: Automate Docker build and run for Android APK output

# Build the container
# Usage: ./build-android-container.sh

docker build -f Dockerfile.android -t sentient-android-build .

docker run --rm -v "$PWD/app/build/outputs:/app/android-build" sentient-android-build

echo "Android build output is in ./app/build/outputs (inside android-build volume)"
