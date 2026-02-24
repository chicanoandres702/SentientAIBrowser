---
description: Start the Android emulator and launch the Expo bundler for Android testing.
---

1. Start the native Android environment. This uses a PowerShell script to globally configure Java/Android SDK Paths, launch the SentientUI emulator, wait for boot completion, and finally execute `npm run android` to push the app to the emulator.
// turbo
2. Execute the run-android script.
```powershell
.\run-android.ps1
```
