#!/usr/bin/env bash
# Call canonical /api/v1/system/health with X-System-Key when SYSTEM_API_KEY is set.
# Production requires SYSTEM_API_KEY; pass it via env (do not commit).
#
# Usage:
#   BASE_URL=https://aistroyka.ai SYSTEM_API_KEY=<secret> ./scripts/ops/system-health.sh
#   BASE_URL=http://localhost:3000 ./scripts/ops/system-health.sh   # dev: no auth when SYSTEM_API_KEY unset
# Optional:
#   SYSTEM_HEALTH_PATH=/api/system/health ./scripts/ops/system-health.sh
set -euo pipefail
BASE="${BASE_URL:-http://localhost:3000}"
PATH_SUFFIX="${SYSTEM_HEALTH_PATH:-/api/v1/system/health}"
KEY="${SYSTEM_API_KEY:-}"
if [[ -n "$KEY" ]]; then
  code=$(curl -sS -o /tmp/system_health.json -w "%{http_code}" -m 15 -H "X-System-Key: $KEY" "$BASE$PATH_SUFFIX" 2>/dev/null || echo "000")
else
  code=$(curl -sS -o /tmp/system_health.json -w "%{http_code}" -m 15 "$BASE$PATH_SUFFIX" 2>/dev/null || echo "000")
fi
if [[ "$code" == "200" ]]; then
  echo "PASS: $PATH_SUFFIX -> 200"
  if command -v jq &>/dev/null; then
    jq -c '{status, buildStamp, services}' /tmp/system_health.json 2>/dev/null || tr -d '\n' < /tmp/system_health.json && echo
  else
    tr -d '\n' < /tmp/system_health.json && echo
  fi
elif [[ "$code" == "503" ]]; then
  echo "FAIL: $PATH_SUFFIX -> 503 (production requires SYSTEM_API_KEY; set env and pass X-System-Key)"
  if command -v jq &>/dev/null; then
    jq -r '.message // .error // .' /tmp/system_health.json 2>/dev/null || tr -d '\n' < /tmp/system_health.json && echo
  else
    tr -d '\n' < /tmp/system_health.json && echo
  fi
  exit 1
elif [[ "$code" == "401" ]]; then
  echo "FAIL: $PATH_SUFFIX -> 401 (X-System-Key missing or wrong)"
  exit 1
else
  echo "FAIL: $PATH_SUFFIX -> HTTP $code"
  exit 1
fi
