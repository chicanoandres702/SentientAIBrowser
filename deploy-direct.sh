#!/usr/bin/env bash
# deploy-direct.sh  (Linux / macOS equivalent of deploy-direct.ps1)
# Direct local deploy: Firebase Firestore rules + Google Cloud Run.
# No GitHub Actions -- pushes straight from your machine.
#
# Usage:
#   ./deploy-direct.sh                        # build TS + deploy rules + cloudrun
#   ./deploy-direct.sh --target cloudrun      # Cloud Run only
#   ./deploy-direct.sh --target rules         # Firestore rules only
#   ./deploy-direct.sh --skip-build           # skip tsc (use existing lib/)
#   ./deploy-direct.sh --use-cloud-build      # force Cloud Build instead of local Docker
#
# Prerequisites: gcloud CLI (gcloud auth login), firebase CLI (firebase login),
#                Docker Desktop (optional -- falls back to Cloud Build)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT='sentient-ai-browser'
REGION='us-central1'
SERVICE='sentient-proxy'
IMAGE="gcr.io/$PROJECT/$SERVICE"
MEMORY='2Gi'
CPU='1'
TIMEOUT='300'
MIN_INST='0'
MAX_INST='2'
FUNCTIONS="$SCRIPT_DIR/functions"
TARGET='all'
SKIP_BUILD=0
USE_CLOUD_BUILD=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --target|-t)       TARGET="$2"; shift 2 ;;
        --skip-build)      SKIP_BUILD=1; shift ;;
        --use-cloud-build) USE_CLOUD_BUILD=1; shift ;;
        *) echo "Unknown arg: $1"; exit 1 ;;
    esac
done

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; GRAY='\033[0;37m'; NC='\033[0m'
step() { echo -e "\n${CYAN}[$1] $2${NC}"; }
ok()   { echo -e "    ${GREEN}+ $1${NC}"; }
warn() { echo -e "    ${YELLOW}! $1${NC}"; }
fail() { echo -e "    ${RED}x $1${NC}"; exit 1; }

# ---- 1. Load .env secrets ----------------------------------------------------
step '1' 'Loading .env secrets'
GEMINI_KEY=''
PUB_GEMINI_KEY=''
PROXY_API_KEY_VAL=''

if [[ -f "$SCRIPT_DIR/.env" ]]; then
    while IFS= read -r line; do
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        key="${line%%=*}"
        val="${line#*=}"
        val="${val%\"*}"; val="${val#\"}"   # strip surrounding double-quotes
        val="${val%\'*}"; val="${val#\'}"   # strip surrounding single-quotes
        case "$key" in
            GOOGLE_API_KEY)                GEMINI_KEY="$val" ;;
            EXPO_PUBLIC_GEMINI_API_KEY)    PUB_GEMINI_KEY="$val" ;;
            PROXY_API_KEY)                 PROXY_API_KEY_VAL="$val" ;;
        esac
    done < "$SCRIPT_DIR/.env"
    ok "Loaded vars from .env"
else
    warn '.env not found -- using process environment only'
    GEMINI_KEY="${GOOGLE_API_KEY:-}"
    PUB_GEMINI_KEY="${EXPO_PUBLIC_GEMINI_API_KEY:-}"
fi

[[ -z "$GEMINI_KEY" ]] && GEMINI_KEY="$PUB_GEMINI_KEY"
[[ -z "$PUB_GEMINI_KEY" ]] && PUB_GEMINI_KEY="$GEMINI_KEY"
[[ -z "$GEMINI_KEY" && "$TARGET" != 'rules' ]] && fail 'Missing GOOGLE_API_KEY / EXPO_PUBLIC_GEMINI_API_KEY in .env'
ok 'Secrets loaded'

# ---- 2. Pre-flight -----------------------------------------------------------
step '2' 'Pre-flight checks'
for cmd in gcloud firebase; do
    command -v "$cmd" &>/dev/null || fail "$cmd CLI not found. Install it and add to PATH."
done
ok 'gcloud + firebase CLIs found'

GCLOUD_ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
[[ -n "$GCLOUD_ACCOUNT" ]] || fail 'gcloud not authenticated. Run: gcloud auth login'
ok "gcloud account: $GCLOUD_ACCOUNT"

gcloud config set project "$PROJECT" --quiet 2>/dev/null || true
gcloud auth configure-docker --quiet 2>/dev/null || true
ok "Active project: $PROJECT"

DOCKER_AVAIL=0
if [[ $USE_CLOUD_BUILD -eq 0 && ("$TARGET" == 'all' || "$TARGET" == 'cloudrun') ]]; then
    if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
        DOCKER_AVAIL=1
        ok 'Docker running -- will build locally (fast)'
    else
        warn 'Docker not running -- will use Cloud Build (slower)'
    fi
fi

# ---- 3. Build TypeScript -----------------------------------------------------
if [[ $SKIP_BUILD -eq 0 && "$TARGET" != 'rules' ]]; then
    step '3' 'Compiling TypeScript (functions/)'
    (cd "$FUNCTIONS" && npm run build) || fail 'TypeScript build failed -- check errors above'
    ok 'Build succeeded -> lib/'
else
    step '3' 'Skipping TypeScript build (--skip-build or rules-only)'
fi

# ---- 4. Deploy Firestore Rules -----------------------------------------------
if [[ "$TARGET" == 'all' || "$TARGET" == 'rules' ]]; then
    step '4' 'Deploying Firestore rules + indexes'
    firebase deploy --only firestore:rules,firestore:indexes --non-interactive --project "$PROJECT" \
        || fail 'Firestore rules deploy failed'
    ok 'Firestore rules + indexes deployed'
else
    step '4' 'Skipping Firestore rules (cloudrun target)'
fi

# ---- 5. Build + Push Docker image --------------------------------------------
if [[ "$TARGET" == 'all' || "$TARGET" == 'cloudrun' ]]; then
    SHA="$(git -C "$SCRIPT_DIR" rev-parse --short HEAD 2>/dev/null || date '+%Y%m%d%H%M%S')"
    TAG_SHA="${IMAGE}:${SHA}"
    TAG_LATEST="${IMAGE}:latest"

    if [[ $DOCKER_AVAIL -eq 1 ]]; then
        step '5' "Building Docker image locally -> $TAG_SHA"
        docker build -t "$TAG_SHA" -t "$TAG_LATEST" "$FUNCTIONS" || fail 'Docker build failed'
        ok 'Image built'
        echo '    Pushing to GCR...'
        docker push "$TAG_SHA" && docker push "$TAG_LATEST" || fail 'Docker push failed'
        ok "Pushed $TAG_SHA"
    else
        step '5' "Cloud Build -> $TAG_SHA"
        gcloud builds submit --tag "$TAG_SHA" "$FUNCTIONS" --project "$PROJECT" --quiet \
            || fail 'Cloud Build failed'
        ok 'Image built + pushed via Cloud Build'
    fi

    # ---- 6. Deploy to Cloud Run ----------------------------------------------
    step '6' "Deploying $SERVICE to Cloud Run ($REGION)"
    ENV_VARS="NODE_ENV=production,GOOGLE_API_KEY=${GEMINI_KEY},EXPO_PUBLIC_GEMINI_API_KEY=${PUB_GEMINI_KEY}"
    [[ -n "${PROXY_API_KEY_VAL}" ]] && ENV_VARS="${ENV_VARS},PROXY_API_KEY=${PROXY_API_KEY_VAL}"

    gcloud run deploy "$SERVICE" \
        --image         "$TAG_SHA" \
        --region        "$REGION" \
        --project       "$PROJECT" \
        --platform      managed \
        --allow-unauthenticated \
        --memory        "$MEMORY" \
        --cpu           "$CPU" \
        --timeout       "$TIMEOUT" \
        --min-instances "$MIN_INST" \
        --max-instances "$MAX_INST" \
        --set-env-vars  "$ENV_VARS" \
        --quiet || fail 'Cloud Run deploy failed'

    SERVICE_URL="$(gcloud run services describe "$SERVICE" --region "$REGION" \
        --project "$PROJECT" --format 'value(status.url)' 2>/dev/null || true)"
    ok 'Cloud Run deployed'
    echo ''
    echo -e "  ${GREEN}Live URL: $SERVICE_URL${NC}"
    echo ''
    [[ -n "$SERVICE_URL" ]] && warn 'If EXPO_PUBLIC_PROXY_URL changed, update it in .env and redeploy web.'
else
    step '5/6' 'Skipping Docker build + Cloud Run (rules target)'
fi

echo ''
ok "Deploy complete! (target=$TARGET)"
echo ''
