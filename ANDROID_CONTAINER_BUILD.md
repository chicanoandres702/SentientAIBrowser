# AIDDE TRACE HEADER
# Android Container Build Guide
# Why: Instructions for building Android app in a container (local/CI/CD)

## Build Locally (Linux/macOS)

```sh
./build-android-container.sh
```

## Build Locally (Windows)

```powershell
./build-android-container.ps1
```

## Output
- APK/AAB files will be in `./app/build/outputs` (inside the `android-build` volume)

## CI/CD
- Add these steps to your CI pipeline to build Android app in a container
- Use `Dockerfile.android` for reproducible builds

## Notes
- Container includes Node.js, Android SDK, Expo CLI
- You can customize the Dockerfile for React Native CLI or other build tools
- For advanced builds, mount secrets/keystores as needed
