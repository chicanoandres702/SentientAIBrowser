# Sentient AI Browser 🤖

[![Firebase Hosting](https://github.com/chicanoandres702/SentientAIBrowser/actions/workflows/firebase-deploy.yml/badge.svg)](https://github.com/chicanoandres702/SentientAIBrowser/actions/workflows/firebase-deploy.yml)
[![Code Quality](https://github.com/chicanoandres702/SentientAIBrowser/actions/workflows/code-quality.yml/badge.svg)](https://github.com/chicanoandres702/SentientAIBrowser/actions/workflows/code-quality.yml)
[![PR Labeler](https://github.com/chicanoandres702/SentientAIBrowser/actions/workflows/labeler.yml/badge.svg)](https://github.com/chicanoandres702/SentientAIBrowser/actions/workflows/labeler.yml)

## 🎯 The "Why" Mandate
Sentient AI Browser is a next-generation web experience designed to integrate AI directly into the browser workflow. It prioritizes modularity, performance, and clear architectural intent to facilitate seamless AI-driven interactions.

## 🏛 Architecture
This project strictly adheres to the **AI Constitution**, ensuring high token density and focused development:
- **Modular First**: Components are small, reusable, and interface-driven.
- **100-Line Law**: No source file exceeds 100 lines to maintain extreme focus.
- **Feature-Driven**: All business logic resides in `src/features/<feature>/`.
- **Why Documentation**: Every design decision is backed by an ADR in `docs/architecture/`.

## 🛠 Prerequisites
- **Node.js**: v20 or higher
- **PowerShell**: Used for all build and deployment automation
- **Firebase CLI**: `npm install -g firebase-tools`
- **GitHub CLI**: `gh` (authenticated for secret syncing)

## 🚀 Getting Started

### 1. Installation
```powershell
git clone https://github.com/chicanoandres702/SentientAIBrowser.git
cd SentientAIBrowser
npm install
```

### 2. Configuration
Create a `.env` file based on your credentials (see AI Constitution for required secrets).
Sync your local credentials to GitHub Secrets:
```powershell
npm run sync-credentials
```


### 3. Running Locally
```powershell
# Start the proxy and web development server
npm run run-web
```

## 🧩 Key Components & APIs

### WorkflowTabs
Tabbed UI for workflow sessions with live WebSocket updates and loading spinner.
Usage:
```tsx
import { WorkflowTabs } from 'src/features/workflow/WorkflowTabs';
<WorkflowTabs workflows={...} />
```

### WorkflowHistoryViewer
Displays past workflow events/results for a user.
Usage:
```tsx
import WorkflowHistoryViewer from 'src/features/workflow/WorkflowHistoryViewer';
<WorkflowHistoryViewer userId={userId} />
```

### NotificationBanner & notification.service
Real-time user feedback for workflow/admin events.
Usage:
```tsx
import NotificationBanner from 'src/features/common/NotificationBanner';
<NotificationBanner />
```

### ErrorBoundary
Modular error boundary for robust error handling.
Usage:
```tsx
import ErrorBoundary from 'src/features/common/ErrorBoundary';
<ErrorBoundary><YourComponent /></ErrorBoundary>
```

### ScreenshotStreamService
Streams Playwright screenshots via WebSocket for live workflow monitoring.
Usage:
```typescript
const streamService = new ScreenshotStreamService(wsUrl);
await streamService.streamScreenshot(page, 1000);
```

### sessionManager.service.js
Multi-user Playwright session orchestration, session timeout, screenshot/video streaming, Firestore logging.
API:
- startSession(userId, userDataDir)
- endSession(userId)
- startScreenshotStream(userId, wsUrl, intervalMs)
- startVideoStream(userId, wsUrl, inputSource)

### logger.service.js
Modular logging utility for workflow events and analytics in Firestore.
API:
- logEvent(type, details)

### Architectural Trace Headers
Every generated file starts with an AIDDE trace header documenting feature, why, and context.

## 📝 ADRs & Design Decisions
See `docs/aidde/` for architecture, traceability, and contract mandates.

## 🚢 Deployment
Deployment is fully automated via GitHub Actions on every push to `main`.
Manual deployment trigger:
```powershell
npm run firebase
```

## 📄 License
Internal Development - All Rights Reserved.
