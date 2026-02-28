# VS Code Launch Configurations

## Available Configurations

### 🌐 Web (Development)
**Primary configuration for testing the web UI with hot reload**

- **How to use**: Press `F5` or go to Run & Debug (Ctrl+Shift+D)
- **What it does**: 
  - Starts Expo dev server on port 8081
  - Opens web version in browser
  - Hot reload enabled for instant style changes
- **Best for**: Testing UI changes, styling, and component updates

### 🐛 Web + Chrome Debug (Compound)
**Web development with full Chrome DevTools integration**

- **How to use**: Select "Web + Chrome Debug" from launch dropdown and press F5
- **What it does**:
  - Starts web server
  - Attaches Chrome debugger on port 9222
  - Full Chrome DevTools access (console, network, elements)
- **Best for**: Debugging JavaScript, network issues, performance profiling

### 📱 Expo (Managed)
**Start Expo CLI for mobile testing**

- **How to use**: Select "Expo (Managed)" and press F5
- **What it does**:
  - Starts Expo development server
  - Shows QR code for Expo Go app on mobile
  - Supports iOS and Android
- **Best for**: Testing on physical devices via Expo Go

### 🤖 Run Android
**Build and launch on Android device/emulator**

- **How to use**: Select "Run Android" and press F5
- **Requires**: Android emulator running or device connected
- **What it does**: Builds app and deploys to Android
- **Best for**: Native Android testing

### 🔧 Debug Android
**Android debugging with React Native debugger**

- **How to use**: Select "Debug Android" and press F5
- **What it does**: Launches app with React Native debugging enabled
- **Best for**: Debugging native Android issues

### ☁️ Sync Cloud Logic (Full Deploy)
**Complete deployment sequence for entire stack**

- **Command**: `.\deploy-cloud.bat`
- **What it does**: 
  - Builds Backend Functions (TypeScript)
  - Deploys UI to Firebase Hosting
  - Deploys Backend Functions to Firebase
  - Deploys Firestore Security Rules & Indexes
- **Best for**: Standard production updates

### 🛡️ Firestore: Deploy Rules Only
**Deploy security rules without redeploying functions**

- **Command**: `firebase deploy --only firestore:rules`
- **Quick Fix**: Use this when fixing "Missing or insufficient permissions"
- **Best for**: Security updates and permission fixes

### 📊 Firestore: Deploy Indexes Only
**Deploy database indexes**

- **Command**: `firebase deploy --only firestore:indexes`
- **Best for**: Performance optimization and query fixing

### ⚡ Firebase: Deploy Functions Only
**Deploy Cloud Functions code only**

- **Command**: `firebase deploy --only functions`
- **Best for**: Logic updates to `sentientProxy` or `onMissionTrigger`

### 🏗️ Firebase: Full Build & Deploy
**Clean build and total deploy**

- **Command**: `npm run deploy` (or `firebase deploy`)
- **Best for**: Initial project setup or environment migration

### 🚀 Proxy Server (Cloud Run)
**Production Playwright Proxy with Chromium**

- **URL**: `https://sentient-proxy-184717935920.us-central1.run.app`
- **Manual Build**: `.\deploy-cloudrun.bat build`
- **Manual Deploy**: `.\deploy-cloudrun.bat deploy`
- **Full Proxy Sync**: `.\deploy-cloudrun.bat all`
- **Best for**: Updating the Playwright/Chromium environment

### 🖥️ Start Local Cloud (Emulator)
**Start local Firebase emulator for testing**

- **Command**: `.\debug-local-cloud.bat`
- **Best for**: Zero-cost local development and offline testing

## Available Tasks

Open Command Palette (Ctrl+Shift+P) and search for "Run Task":

### 🔍 Validate Sentient Code (Watch)
Monitors codebase for Traceability Headers and 100-line law compliance
- **Runs**: `node validate-sentient-code.js`
- **Watch**: Enabled - monitors changes continuously
- **Best for**: Enforcing AI Constitution (Section 9.1 & 11)
- **Fails if**: Files lack `// Feature:` headers or exceed 100 lines

### 🔄 Sync GitHub Tree (Watch)
Synchronizes task tree with GitHub Issues and Milestones
- **Runs**: `node sync-gh-tree.js`
- **Watch**: Enabled - syncs on file changes
- **Best for**: Keeping remote planning aligned with local tasks
- **Requires**: GitHub CLI (`gh`) installed and authenticated

### 🎼 Orchestrator Service (Watch)
Manages task-based branching, auto-commits, and workflow coordination
- **Runs**: `node orchestrator.service.js`
- **Watch**: Enabled - monitors all changes
- **Best for**: Automated task tracking and branch management
- **Features**: 
  - Creates feature branches per task
  - Auto-commits on active tasks
  - Prevents work on main branch
  - Opens PRs for new task work

### Clear Cache & Rebuild Web
```
Clears node_modules cache, .expo cache, and rebuilds web
Use this if styles aren't showing up after changes
```

### npm: web
Standalone web dev server startup

### npm: start  
Standalone Expo server startup

## Quick Start Guide

### To See UI Changes (Most Common)

1. **Make style changes** to `.ts` files (e.g., `App.layout.styles.ts`)

2. **Start the web dev server**:
   - Press `F5` and select "Web (Development)"
   - Or run task "npm: web"

3. **View changes**:
   - Browser opens automatically at `http://localhost:19006`
   - Hot reload should update styles in real-time

4. **If changes don't appear**:
   - Run task "Clear Cache & Rebuild Web"
   - Then restart Web (Development) config

### To Debug JavaScript

1. Select "Web + Chrome Debug" from launch dropdown
2. Press `F5`
3. Chrome DevTools opens automatically
4. Use console, breakpoints, and debugger as normal

### To Test on Mobile

1. Select "Run Android" (for Android device/emulator)
2. Press `F5`
3. App builds and deploys automatically

## Environment Files

Make sure `.env` is configured with:
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
```

## Common Issues

### "Module not found" or build errors
- Run: `npm install`
- Then run task: "Clear Cache & Rebuild Web"

### Styles not updating
- Run task: "Clear Cache & Rebuild Web"
- Make sure you're modifying `.styles.ts` files, not just `.tsx`

### Port 8081 already in use
- Kill existing Expo process: `npx kill-port 8081`
- Then restart the config

### Chrome debugger won't attach
- Make sure Chrome is closed
- Check that port 9222 is available
- Try running "Web + Chrome Debug" again

## Development Workflow

```
1. Edit .styles.ts or .tsx files
2. Save (Ctrl+S)
3. Check browser - hot reload updates
4. If not updating, run "Clear Cache & Rebuild Web"
5. Use Chrome DevTools for debugging as needed
```

## Tips

- **Hot Reload**: Enabled by default in web dev mode - changes appear instantly
- **Fast Refresh**: React Native's Fast Refresh for component updates
- **Source Maps**: Available for debugging TypeScript
- **Network Tab**: Use Chrome DevTools to inspect API calls
- **React DevTools**: Install React DevTools Chrome extension for better debugging
