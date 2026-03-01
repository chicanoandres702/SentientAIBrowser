---
description: "Full repository initialization orchestrator. Runs GitHub setup (Steps 1-7) then Cloud setup (Steps 8-10). Delegates to repo_init_github and repo_init_cloud."
argument-hint: "owner/repo name and optional GCP/Firebase project IDs"
agent: "agent"
tools: ["execute", "read"]
---

# /repo_init — Full Repository Setup

Collect these values before starting (ask if not provided):
- `OWNER` — GitHub org or username
- `REPO` — repository name
- `GCP_PROJECT_ID` — Google Cloud project ID
- `FIREBASE_PROJECT_ID` — Firebase project ID
- `GCP_REGION` — e.g. `us-central1`

## Execution Order

### Part 1 — GitHub Infrastructure
Run all steps in `/repo_init_github`:
- Step 1: Repo features (wiki, issues, discussions, projects, merge strategy)
- Step 2: GitHub Pages (`/docs` on `main`)
- Step 3: Branch protection — `main`
- Step 4: Branch protection — `feature/*`
- Step 5: Rulesets (deletion lock, no force-push, signatures, PR required)
- Step 6: Standard labels (8 AIDDE labels)
- Step 7: Secrets checklist (print required secret names)

### Part 2 — Cloud Infrastructure
Run all steps in `/repo_init_cloud`:
- Step 8: GCP project setup (enable APIs, Artifact Registry)
- Step 9: Firebase project setup (hosting, firestore, functions)
- Step 10: Initial commit and push to `main`

## Completion
Confirm all 10 steps completed. Report any failures with remediation steps.
