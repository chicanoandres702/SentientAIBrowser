#!/usr/bin/env bash
# deploy-frontend.sh  (Linux / macOS equivalent of deploy-frontend.ps1)
# Full frontend pipeline: clear caches -> type-check -> Expo export -> Firebase Hosting deploy
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; GRAY='\033[0;37m'; NC='\033[0m'
step() { echo -e "\n${CYAN}$1${NC}"; }
ok()   { echo -e "  ${GREEN}$1${NC}"; }
warn() { echo -e "  ${YELLOW}! $1${NC}"; }
fail() { echo -e "\n${RED}[ABORT] $1${NC}"; exit 1; }

echo ''
echo '=== Sentient UI: Full Frontend Deploy ==='
echo ''

# Step 1: Clear stale caches
step '[1/5] Clearing caches...'
rm -rf node_modules/.cache .expo dist
ok 'Caches cleared.'

# Step 2: Load env vars so EXPO_PUBLIC_ keys bake into the bundle
step '[2/5] Loading environment...'
if [[ -f .env ]]; then
    # Strip double-quotes from values (mirrors PS1 behavior)
    sed -i.bak 's/"//g' .env && rm -f .env.bak
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
    ok '.env loaded'
else
    warn '.env not found -- using process environment only'
fi

# Step 3: TypeScript check
step '[3/5] Type-checking TSX files...'
npx tsc --noEmit || fail 'TypeScript errors found. Fix before deploying.'
ok 'No type errors.'

# Step 4: Build Expo web bundle
step '[4/5] Building web bundle (Expo export)...'
npx expo export --platform web || fail 'Expo build failed.'
ok 'Bundle ready -> dist/'

# Step 5: Deploy to Firebase Hosting
step '[5/5] Deploying to Firebase Hosting...'
firebase deploy --only hosting --project sentient-ai-browser || fail 'Firebase Hosting deploy failed.'

echo ''
echo '=== Frontend Deploy Complete ==='
echo ''
