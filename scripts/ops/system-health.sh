#!/usr/bin/env bash
# Call /api/system/health with X-System-Key when SYSTEM_API_KEY is set.
# Production requires SYSTEM_API_KEY; pass it via env (do not commit).
#
# Usage:
#   BASE_URL=https://aistroyka.ai SYSTEM_API_KEY=<secret> ./scripts/ops/system-health.sh
#   BASE_URL=http://localhost:3000 ./scripts/ops/system-health.sh   # dev: no auth when SYSTEM_API_KEY unset
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
KEY="${SYSTEM_API_KEY:-}"
if [[ -n "$KEY" ]]; then
  code=$(curl -sS -o /tmp/system_health.json -w "%{http_code}" -m 15 -H "X-System-Key: $KEY" "$BASE/api/system/health" 2>/dev/null || echo "000")
else
  code=$(curl -sS -o /tmp/system_health.json -w "%{http_code}" -m 15 "$BASE/api/system/health" 2>/dev/null || echo "000")
fi
if [[ "$code" == "200" ]]; then
  echo "PASS: /api/system/health → 200"
  command -v jq &>/dev/null && jq -c '{status, buildStamp, services}' /tmp/system_health.json 2>/dev/null || cat /tmp/system_health.json
elif [[ "$code" == "503" ]]; then
  echo "FAIL: /api/system/health → 503 (production requires SYSTEM_API_KEY; set env and pass X-System-Key)"
  command -v jq &>/dev/null && jq -r '.message // .error // .' /tmp/system_health.json 2>/dev/null || cat /tmp/system_health.json
  exit 1
elif [[ "$code" == "401" ]]; then
  echo "FAIL: /api/system/health → 401 (X-System-Key missing or wrong)"
  exit 1
else
  echo "FAIL: /api/system/health → HTTP $code"
  exit 1
fi
