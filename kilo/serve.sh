#!/usr/bin/env bash
# kilo/serve.sh
# Feature: Kilo Server | Trace: kilo/serve.sh
# Why: Plain-server launcher (no Cloud Run, no GCP). Brings up the Kilo/OpenCode
# HTTP server so Kilo can run on any Linux VM. Usage: KILO_SERVER_PASSWORD=... bash kilo/serve.sh
set -euo pipefail

PORT="${KILO_SERVER_PORT:-4096}"
HOST="${KILO_SERVER_HOST:-0.0.0.0}"
# CORS origins that may drive the server from a browser (space-separated).
IFS=' ' read -r -a CORS <<< "${KILO_CORS:-}"

# Make sure the OpenCode CLI exists. Install it on the fly if missing so the
# script works on a bare server without any pre-provisioning.
if ! command -v opencode >/dev/null 2>&1; then
  echo "opencode not found, installing..."
  if command -v npm >/dev/null 2>&1; then
    npm install -g opencode
  else
    echo "ERROR: npm is required to install opencode. Install Node.js first." >&2
    exit 1
  fi
fi

ARGS=(serve --hostname "$HOST" --port "$PORT")
for origin in "${CORS[@]}"; do
  [ -n "$origin" ] && ARGS+=(--cors "$origin")
done

if [ -n "${OPENCODE_SERVER_PASSWORD:-}" ]; then
  export OPENCODE_SERVER_PASSWORD
fi
if [ -n "${OPENCODE_SERVER_USERNAME:-}" ]; then
  export OPENCODE_SERVER_USERNAME
fi

echo "Starting Kilo/OpenCode server on ${HOST}:${PORT}"
exec opencode "${ARGS[@]}"
