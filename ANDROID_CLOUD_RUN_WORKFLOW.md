# Native Android App + Cloud Run Backend Workflow

## Overview
This workflow enables you to build, install, and launch the native Android app, connecting it to a backend deployed as a GitHub container (Cloud Run endpoint).

## Steps

1. **Configure Backend Endpoint**
   - Edit `.env` in the project root.
   - Set `CLOUD_RUN_ENDPOINT=https://your-cloud-run-endpoint-url` to your deployed Cloud Run service URL.

2. **Build, Install, and Launch the App**
   - In VS Code, open the command palette (`Ctrl+Shift+P`).
   - Run `Tasks: Run Task` and select `[Android] Build + Install + Launch (Cloud Run)`.
   - The app will build, install on your device/emulator, and launch, connecting to the backend.

3. **Backend Deployment**
   - Use `[GitHub] Deploy: Cloud Run only` task to deploy the backend container to Cloud Run if needed.

## Troubleshooting
- Ensure your device/emulator is connected and recognized by ADB.
- Make sure the Cloud Run endpoint is reachable from your device.
- Update the endpoint in `.env` if the backend URL changes.

---
For advanced usage, see `deploy-android.ps1` and `deploy-github.ps1` for custom build/deploy options.
