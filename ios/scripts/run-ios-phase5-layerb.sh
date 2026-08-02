#!/usr/bin/env bash
# Phase 5 canonical Layer B orchestrator entrypoint.
# Creates dedicated simulator, temp personas, runs Worker→Manager lifecycle UITests, cleans up.
# Does not commit, deploy, upload to TestFlight, or mutate Apple Developer state.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PRIV="${PHASE5_PRIV_DIR:-/tmp/aistroyka-phase5-orch}"
mkdir -p "$PRIV"
chmod 700 "$PRIV"

export PHASE5_REPO_ROOT="$REPO_ROOT"
export PHASE5_PRIV_DIR="$PRIV"
export IOS_PHASE5_NO_SKIP=1
export IOS_PHASE5=1
export PHASE5_BASE_URL="${PHASE5_BASE_URL:-${IOS_E2E_BASE_URL:-http://127.0.0.1:3000}}"

exec node "$REPO_ROOT/ios/scripts/phase5-orchestrate.mjs"
