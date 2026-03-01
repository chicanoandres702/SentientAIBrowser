---
description: "Deploy to Firebase Hosting, Firestore rules, and Firebase Functions using the firebase CLI."
argument-hint: "Deployment target: hosting, functions, firestore:rules, or all"
agent: "agent"
tools: ["execute", "read"]
---

# /deploy_firebase — Firebase Deploy Workflow

Delegate to `deploy-engineer` agent.

## Pre-Deploy Checks
```bash
# Confirm all CI/CD gates passed first
gh pr checks 2>/dev/null || echo "Direct deploy — ensure gates passed manually"

# Confirm correct project
firebase use
echo "Deploying to: $FIREBASE_PROJECT_ID"
```

## Build
```bash
npm run build --if-present
```

## Deploy
```bash
# Full deploy (default)
firebase deploy --only hosting,firestore:rules,functions

# Or targeted:
# firebase deploy --only hosting
# firebase deploy --only functions:{name}
# firebase deploy --only firestore:rules
```

## Verify
```bash
firebase hosting:channel:list 2>/dev/null || true
echo "✅ Firebase deploy complete"
```

Report: what was deployed, project ID, and any errors.
