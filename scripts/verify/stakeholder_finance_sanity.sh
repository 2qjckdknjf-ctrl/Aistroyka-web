#!/usr/bin/env bash
# Live customer-finance sanity (staging/prod): portal session + costs deny + JSON key denylist.
# Requires a real STAKEHOLDER (or portal-only) user — not tenant owner/manager.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=../smoke/_json_lib.sh
source "$REPO_ROOT/scripts/smoke/_json_lib.sh"

if [[ -f "$REPO_ROOT/.env.pilot" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.env.pilot"
  set +a
fi

BASE_URL="${STAKEHOLDER_FINANCE_BASE_URL:-${BASE_URL:-https://staging.aistroyka.ai}}"
BASE_URL="${BASE_URL%/}"
EMAIL="${STAKEHOLDER_SMOKE_EMAIL:-}"
PASSWORD="${STAKEHOLDER_SMOKE_PASSWORD:-}"

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "BLOCKED: set STAKEHOLDER_SMOKE_EMAIL and STAKEHOLDER_SMOKE_PASSWORD in env or repo-root .env.pilot"
  echo "  (dedicated stakeholder user — see docs/security/STAKEHOLDER_SMOKE_ACCOUNT_SETUP_REPORT.md)"
  exit 2
fi

SFS_TMP="$(mktemp -d)"
COOKIEJAR="$SFS_TMP/cookies.txt"
cleanup() { rm -rf "$SFS_TMP"; }
trap cleanup EXIT

SMOKE_LOGIN_EMAIL="$EMAIL" SMOKE_LOGIN_PASSWORD="$PASSWORD" smoke_python3 -c 'import json,os; print(json.dumps({"email":os.environ["SMOKE_LOGIN_EMAIL"],"password":os.environ["SMOKE_LOGIN_PASSWORD"],"traceId":"stakeholder-finance-sanity"}))' > "$SFS_TMP/login-request.json"
code="$(curl -sS -c "$COOKIEJAR" -o "$SFS_TMP/login.json" -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  --data-binary "@$SFS_TMP/login-request.json")"
if [[ "$code" != "200" ]]; then
  echo "FAIL: login HTTP $code"
  exit 1
fi

me="$(curl -sS -b "$COOKIEJAR" -H 'Accept: application/json' "$BASE_URL/api/v1/me")"
role="$(smoke_python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("data") or {}).get("role") or "")' <<<"$me")"
if [[ "$role" != "stakeholder" ]]; then
  echo "BLOCKED: /api/v1/me role is '$role', expected 'stakeholder' (do not use owner/manager smoke user)."
  exit 2
fi

plist_code="$(curl -sS -b "$COOKIEJAR" -H 'Accept: application/json' -o "$SFS_TMP/portal-list.json" -w '%{http_code}' "$BASE_URL/api/v1/portal/projects")"
if [[ "$plist_code" == "404" ]]; then
  echo "BLOCKED: GET /api/v1/portal/projects returned 404 — portal API not served on this host (redeploy OpenNext worker or fix routing)."
  exit 3
fi
if [[ "$plist_code" != "200" ]]; then
  echo "FAIL: portal/projects HTTP $plist_code"
  exit 1
fi

pid="$(smoke_python3 -c 'import json,sys; j=json.load(sys.stdin); a=j.get("data") or []; print(a[0]["id"] if a else "")' < "$SFS_TMP/portal-list.json")"
if [[ -z "$pid" ]]; then
  echo "BLOCKED: no portal projects for this user (enable client portal + membership)."
  exit 2
fi

for method in GET POST; do
  if [[ "$method" == "GET" ]]; then
    c="$(curl -sS -b "$COOKIEJAR" -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$BASE_URL/api/v1/projects/$pid/costs")"
  else
    c="$(curl -sS -b "$COOKIEJAR" -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -H 'Accept: application/json' \
      -d '{"title":"e2e-line","planned_amount":1}' "$BASE_URL/api/v1/projects/$pid/costs")"
  fi
  if [[ "$c" != "403" ]]; then
    echo "FAIL: $method /api/v1/projects/$pid/costs expected 403, got $c"
    exit 1
  fi
done

estimate_code="$(curl -sS -b "$COOKIEJAR" -o /dev/null -w '%{http_code}' -H 'Accept: application/json' \
  "$BASE_URL/api/v1/projects/$pid/estimate")"
if [[ "$estimate_code" != "403" ]]; then
  echo "FAIL: GET /api/v1/projects/$pid/estimate expected 403, got $estimate_code"
  exit 1
fi

portal_code="$(curl -sS -b "$COOKIEJAR" -H 'Accept: application/json' -o "$SFS_TMP/portal-proj.json" -w '%{http_code}' "$BASE_URL/api/v1/portal/projects/$pid")"
if [[ "$portal_code" != "200" ]]; then
  echo "FAIL: portal project projection expected HTTP200, got $portal_code"
  exit 1
fi
smoke_python3 "$SCRIPT_DIR/customer_portal_payload.py" --project-id "$pid" < "$SFS_TMP/portal-proj.json"

echo "PASS: stakeholder finance sanity ($BASE_URL, project $pid)"
