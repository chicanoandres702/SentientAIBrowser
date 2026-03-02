#!/usr/bin/env bash
# deploy-android.sh  (Linux / macOS)
# Build and optionally submit Android app via EAS Build + EAS Submit.
#
# Usage:
#   ./deploy-android.sh                         # EAS build only (production)
#   ./deploy-android.sh build production        # explicit
#   ./deploy-android.sh build preview            # preview profile
#   ./deploy-android.sh submit                  # submit latest build to Play Store
#   ./deploy-android.sh all production          # build + submit
set -euo pipefail

TARGET="${1:-build}"    # build | submit | all
PROFILE="${2:-production}"

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'
step() { echo -e "\n${CYAN}[$1] $2${NC}"; }
ok()   { echo -e "  ${GREEN}+ $1${NC}"; }
warn() { echo -e "  ${YELLOW}! $1${NC}"; }
fail() { echo -e "  ${RED}x $1${NC}"; exit 1; }

# ---- 1. Type-check -----------------------------------------------------------
step '1' 'Type-checking...'
npx tsc --noEmit || fail 'TypeScript errors found -- fix before building'
ok 'No type errors'

# ---- 2. Ensure EAS CLI -------------------------------------------------------
step '2' 'Checking EAS CLI'
if ! command -v eas &>/dev/null; then
    warn 'eas CLI not found -- installing globally'
    npm install -g eas-cli
fi
ok 'eas CLI ready'

# ---- 3. EAS Build ------------------------------------------------------------
if [[ "$TARGET" == 'build' || "$TARGET" == 'all' ]]; then
    step '3' "EAS Build: android ($PROFILE)"
    eas build --platform android --profile "$PROFILE" --non-interactive
    ok 'Android build submitted to EAS'
fi

# ---- 4. EAS Submit -----------------------------------------------------------
if [[ "$TARGET" == 'submit' || "$TARGET" == 'all' ]]; then
    step '4' 'EAS Submit: android -> Play Store'
    eas submit --platform android --latest --non-interactive
    ok 'Submitted to Play Store'
fi

echo ''
ok "Android deploy complete! (target=$TARGET, profile=$PROFILE)"
echo ''
