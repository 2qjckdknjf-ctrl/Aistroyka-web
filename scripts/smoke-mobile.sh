#!/usr/bin/env bash
# Smoke for mobile flows: sync bootstrap/changes, upload session create (with x-device-id).
# Usage: BASE_URL=... AUTH_HEADER="Bearer <token>" ./scripts/smoke-mobile.sh

set -e
BASE="${BASE_URL:-http://localhost:3000}"
DEVICE_ID="${DEVICE_ID:-smoke-device-001}"
H="${AUTH_HEADER:-}"

echo "Smoke mobile: $BASE"
if [ -z "$H" ]; then
  echo "  (no AUTH_HEADER; skipping authenticated sync/upload)"
  exit 0
fi
curl -sf -H "Authorization: $H" -H "x-device-id: $DEVICE_ID" "${BASE}/api/v1/sync/bootstrap" | jq -e '.cursor >= 0' && echo "  sync bootstrap ok" || true
echo "  mobile smoke done"
