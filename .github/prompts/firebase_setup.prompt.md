---
description: "Initialize Firebase project, configure hosting, Firestore, Auth, and Functions. Sets up emulators for local development."
argument-hint: "Firebase project ID"
agent: "agent"
tools: ["execute", "edit"]
---

# /firebase_setup — Firebase Project Setup

Ask for `FIREBASE_PROJECT_ID` if not set.

```bash
# Authenticate and select project
firebase login --no-localhost 2>/dev/null || firebase login
firebase use $FIREBASE_PROJECT_ID

# Initialize services (interactive — select: Hosting, Firestore, Functions, Emulators)
firebase init

# Or non-interactive with defaults
firebase init --non-interactive hosting firestore functions 2>/dev/null || true

# Configure emulators for local dev
firebase init emulators 2>/dev/null || true
```

## Generate firebase.json if missing
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true }
  }
}
```

```bash
echo "✅ Firebase project $FIREBASE_PROJECT_ID configured"
firebase projects:list
```

Report: project ID, services configured, emulator ports.
