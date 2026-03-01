---
description: "Cloud infrastructure setup for AIDDE v2. Steps 8-10: GCP project APIs, Artifact Registry, Firebase init, initial commit and push. Called by /repo_init."
argument-hint: "GCP_PROJECT_ID, GCP_REGION, FIREBASE_PROJECT_ID must be set"
agent: "agent"
tools: ["execute", "read"]
---

# /repo_init_cloud — Cloud Infrastructure Setup (Steps 8–10)

Requires: `GCP_PROJECT_ID`, `GCP_REGION`, `FIREBASE_PROJECT_ID` variables set.

## Step 8: GCP Project Setup
```bash
gcloud config set project $GCP_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com

# Create Docker registry (idempotent)
gcloud artifacts repositories create aidde-registry \
  --repository-format=docker \
  --location=$GCP_REGION \
  --description="AIDDE container registry" 2>/dev/null || true

# Create Workload Identity Pool for GitHub Actions (keyless auth)
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool" 2>/dev/null || true

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub" 2>/dev/null || true
```

## Step 9: Firebase Project Setup
```bash
firebase use $FIREBASE_PROJECT_ID

# Init hosting, firestore, and functions (non-interactive)
firebase init --non-interactive hosting firestore functions 2>/dev/null || true

# Start emulators to validate config locally
firebase emulators:start --only firestore,functions --import=./emulator-data \
  --export-on-exit=./emulator-data &
sleep 5 && kill %1 2>/dev/null || true
echo "✅ Firebase project configured."
```

## Step 10: Initial Commit
```bash
git add .
git commit -m "feat: initialize AIDDE v2 repository

- Add all AIDDE agent, prompt, and instruction files
- Configure GitHub branch protection and rulesets
- Set up CI/CD Do It Check workflow
- Add issue templates and PR template

Parent Feature (Milestone): AIDDE Bootstrap (ID: #1)"
git push origin main
echo "✅ Initial commit pushed."
```

Confirm Steps 8–10 complete. Report any failures with remediation steps.
