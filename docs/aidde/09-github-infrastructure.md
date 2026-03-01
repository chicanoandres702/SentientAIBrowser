# Component: GitHub Infrastructure & Setup

## 1. AIDDE Orchestrator (GitHub App)

**Do NOT use a PAT.** Create a GitHub App for the AI's isolated identity.

### Setup Steps
1. GitHub → Settings → Developer Settings → GitHub Apps → New GitHub App
2. Name: `AIDDE-Orchestrator-{YourProject}`
3. Required permissions (Principle of Least Privilege):
   - Contents: Read & Write
   - Issues: Read & Write
   - Pull Requests: Read & Write
   - Workflows: Read & Write
   - Metadata: Read-only
   - **Admin: FORBIDDEN**
4. Install the App on your specific repository
5. Generate a private key (.pem file)

## 2. Required Secrets
Set in: Repository Settings → Secrets and variables → Actions

| Secret | Value |
|--------|-------|
| `AIDDE_APP_ID` | Numeric GitHub App ID |
| `AIDDE_APP_PRIVATE_KEY` | Contents of the .pem file |
| `AIDDE_INSTALL_ID` | Installation ID for this repo |
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `GCP_REGION` | e.g. `us-central1` |
| `GCP_SERVICE_ACCOUNT` | SA email for deployments |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF provider resource name |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_TOKEN` | Firebase CI token |

**Enable GitHub Advanced Security / Secret Scanning** to catch any
AI hallucinations that output fake or real keys.

## 3. Branch Protection Rules

### main (or develop)
- Require PR before merging
- Require status checks: `validate-aidde-quad`
- Require signed commits
- Do not allow bypassing — applies to admins too
- Require linear history

### feature/*
- Require PR before merging
- Require status checks: `validate-aidde-quad`

## 4. Rulesets
Create an `AIDDE Ruleset` targeting `~DEFAULT_BRANCH`:
- Restrict deletions
- Require non-fast-forward protection
- Require signed commits
- Require PR with 1 approval

## 5. Workflow Files
| File | Purpose |
|------|---------|
| `.github/workflows/do-it-check.yml` | 8 CI/CD gates on every PR |
| `.github/workflows/release.yml` | Auto-release on version tags |
| `.github/workflows/deploy-firebase.yml` | Firebase deploy on main push |
| `.github/workflows/deploy-cloudrun.yml` | Cloud Run deploy on main push |

Run `/repo_init` to automate all of the above via `gh` CLI.
