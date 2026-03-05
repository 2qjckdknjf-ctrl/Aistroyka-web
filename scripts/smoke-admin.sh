#!/usr/bin/env bash
# Smoke for admin: SLO overview, config (flags).
# Usage: BASE_URL=... AUTH_HEADER="Bearer <token>" ./scripts/smoke-admin.sh

set -e
BASE="${BASE_URL:-http://localhost:3000}"
H="${AUTH_HEADER:-}"

echo "Smoke admin: $BASE"
if [ -z "$H" ]; then
  echo "  (no AUTH_HEADER; skipping admin)"
  exit 0
fi
curl -sf -H "Authorization: $H" "${BASE}/api/v1/config" | jq -e '.flags != null' && echo "  config ok" || true
curl -sf -H "Authorization: $H" "${BASE}/api/v1/admin/slo/overview?range=7d" | jq -e '.data != null' && echo "  slo overview ok" || true
echo "  admin smoke done"
