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

## 🚢 Deployment
Deployment is fully automated via GitHub Actions on every push to `main`.
Manual deployment trigger:
```powershell
npm run firebase
```

## 📄 License
Internal Development - All Rights Reserved.
