#!/usr/bin/env bash
# deploy-github.sh  (Linux / macOS equivalent of deploy-github.ps1)
# Full deploy via GitHub Actions: pre-flight -> git push -> watch live status -> Cloud Run URL
#
# Usage:
#   ./deploy-github.sh                          # deploy all
#   ./deploy-github.sh --target cloudrun        # Cloud Run only
#   ./deploy-github.sh --target functions       # Firestore rules only
#   ./deploy-github.sh --target hosting         # Firebase Hosting only
#   ./deploy-github.sh --no-push                # skip git commit/push
#   ./deploy-github.sh --no-watch               # trigger and exit
#
# Requires: gh CLI authenticated (gh auth login)
set -euo pipefail

CLOUD_RUN_SERVICE='sentient-proxy'
CLOUD_RUN_REGION='us-central1'
TARGET='all'
NO_PUSH=0
WATCH=1

while [[ $# -gt 0 ]]; do
    case "$1" in
        --target|-t)  TARGET="$2"; shift 2 ;;
        --no-push)    NO_PUSH=1; shift ;;
        --no-watch)   WATCH=0; shift ;;
        *) echo "Unknown arg: $1"; exit 1 ;;
    esac
done

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; GRAY='\033[0;37m'; NC='\033[0m'
step() { echo -e "\n${CYAN}[$1] $2${NC}"; }
ok()   { echo -e "  ${GREEN}+ $1${NC}"; }
warn() { echo -e "  ${YELLOW}! $1${NC}"; }
fail() { echo -e "  ${RED}x $1${NC}"; exit 1; }
info() { echo -e "  ${GRAY}. $1${NC}"; }

# ---- 1. Pre-flight -----------------------------------------------------------
step '1' 'Pre-flight checks'

command -v gh &>/dev/null || fail 'gh CLI not found. Install: https://cli.github.com'
gh auth status &>/dev/null    || fail 'gh not authenticated. Run: gh auth login'
ok 'gh CLI authenticated'

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
[[ -n "$REPO" ]]   || fail 'Not inside a GitHub repo.'
[[ -n "$BRANCH" ]] || fail 'Not inside a git repo.'
ok "Repo  : $REPO"
ok "Branch: $BRANCH"
ok "Target: $TARGET"

if command -v gcloud &>/dev/null; then
    GCLOUD_ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
    if [[ -n "$GCLOUD_ACCOUNT" ]]; then
        ok "gcloud account: $GCLOUD_ACCOUNT"
    else
        warn 'gcloud not authenticated locally (CI uses FIREBASE_SERVICE_ACCOUNT -- OK)'
    fi
fi

# ---- 2. Git commit + push ----------------------------------------------------
if [[ $NO_PUSH -eq 0 ]]; then
    step '2' 'Git -- commit & push'

    STAGED="$(git diff --cached --name-only 2>/dev/null || true)"
    UNSTAGED="$(git diff --name-only 2>/dev/null || true)"
    UNTRACKED="$(git ls-files --others --exclude-standard 2>/dev/null || true)"

    if [[ -n "$STAGED" || -n "$UNSTAGED" || -n "$UNTRACKED" ]]; then
        git add -A
        STAMP="$(date '+%Y-%m-%d %H:%M')"
        MESSAGE="chore: deploy snapshot [$TARGET] $STAMP"
        git commit -m "$MESSAGE"
        ok "Committed: $MESSAGE"
    else
        info 'Nothing to commit -- pushing current HEAD'
    fi

    git push origin "$BRANCH"
    ok "Pushed to $BRANCH"
else
    info '--no-push: skipping git commit/push'
fi

# ---- 3. Trigger GitHub Actions -----------------------------------------------
step '3' "Triggering GitHub Actions (target=$TARGET)"

gh workflow run deploy.yml --repo "$REPO" --ref "$BRANCH" --field "target=$TARGET" \
    || fail "Could not trigger workflow (does deploy.yml exist on $BRANCH?)"

sleep 5

RUN_ID="$(gh run list --repo "$REPO" --workflow deploy.yml --limit 1 --json databaseId -q '.[0].databaseId')"
RUN_URL="https://github.com/$REPO/actions/runs/$RUN_ID"
ok "Run ID : $RUN_ID"
ok "URL    : $RUN_URL"

# ---- 4. Live status ----------------------------------------------------------
if [[ $WATCH -eq 1 && -n "$RUN_ID" ]]; then
    step '4' 'Waiting for jobs to complete  (Ctrl+C to detach)'
    info "Following: $RUN_URL"
    echo ''

    set +e
    gh run watch "$RUN_ID" --repo "$REPO" --exit-status
    EXIT_CODE=$?
    set -e

    echo ''
    step '4b' 'Job results'
    JOBS_RAW="$(gh run view "$RUN_ID" --repo "$REPO" --json jobs 2>/dev/null || true)"
    if [[ -n "$JOBS_RAW" ]]; then
        python3 - <<EOF 2>/dev/null || true
import json, sys
jobs = json.loads('''$JOBS_RAW''').get('jobs', [])
for j in jobs:
    s = j.get('conclusion') or 'running'
    n = j.get('name','')
    if s == 'success':   print(f'  \033[0;32m+ {n}\033[0m')
    elif s == 'skipped': print(f'  . SKIPPED  {n}')
    elif s == 'failure': print(f'  \033[0;31mx {n}\033[0m')
    else:                print(f'  ! {s}  {n}')
EOF
    fi

    if [[ $EXIT_CODE -ne 0 ]]; then
        echo ''
        fail "One or more jobs failed. Logs: gh run view $RUN_ID --repo $REPO --log-failed"
    fi
else
    info '--no-watch: not tailing logs.'
    info "Monitor: gh run watch $RUN_ID --repo $REPO"
fi

# ---- 5. Post-deploy Cloud Run URL -------------------------------------------
if [[ "$TARGET" == 'all' || "$TARGET" == 'cloudrun' ]]; then
    step '5' 'Cloud Run service URL'
    if command -v gcloud &>/dev/null; then
        SERVICE_URL="$(gcloud run services describe "$CLOUD_RUN_SERVICE" \
            --region "$CLOUD_RUN_REGION" --format 'value(status.url)' 2>/dev/null || true)"
        if [[ -n "$SERVICE_URL" ]]; then
            ok "$SERVICE_URL"
        else
            info 'gcloud not configured locally -- see https://console.cloud.google.com/run'
        fi
    else
        info 'gcloud not installed -- see https://console.cloud.google.com/run'
    fi
fi

echo ''
ok 'Deploy complete!'
echo ''
