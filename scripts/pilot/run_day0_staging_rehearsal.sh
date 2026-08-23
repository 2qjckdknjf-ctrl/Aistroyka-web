#!/usr/bin/env bash
# Synthetic Day-0 staging rehearsal @ v1.0.0-rc.1 — example.com intake only.
# Does NOT provision a real client tenant. Validates operator toolchain + platform smokes.
#
# Usage:
#   set -a && source .env.pilot && source apps/web/.env.local && set +a
#   bash scripts/pilot/run_day0_staging_rehearsal.sh
#
# Optional: BASE_URL (default https://staging.aistroyka.ai)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

BASE_URL="${BASE_URL:-https://staging.aistroyka.ai}"
export BASE_URL
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-$BASE_URL}"

echo "=== Day-0 staging rehearsal (synthetic) ==="
echo "target: $BASE_URL"
echo ""

echo "[1/6] validate example intake (example.com)"
bun run pilot:intake:validate -- docs/launch/pilot-intake.example.json

echo ""
echo "[2/6] pilot_launch.sh"
bash scripts/smoke/pilot_launch.sh

echo ""
echo "[3/6] ios_mobile_api_chain.sh"
bash scripts/smoke/ios_mobile_api_chain.sh

echo ""
echo "[4/6] security_headers.sh"
bash scripts/smoke/security_headers.sh "$BASE_URL"

echo ""
echo "[5/6] pilot-go-live-check (cron skipped)"
PILOT_BASE_URL="$BASE_URL" PILOT_SKIP_CRON=1 node scripts/pilot-go-live-check.mjs

echo ""
echo "[6/6] forgot-password route probe"
if bash scripts/pilot/verify_forgot_password_route.sh "$BASE_URL"; then
  echo "  forgot-password: LIVE"
else
  echo "  forgot-password: NOT DEPLOYED (expected until PR #229 merge)"
fi

echo ""
echo "day0_staging_rehearsal: DONE (synthetic — not a client Day-0 YES)"
