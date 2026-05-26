#!/usr/bin/env bash
# Live customer-finance sanity (staging/prod): portal session + costs deny + JSON key denylist.
# Requires a real STAKEHOLDER (or portal-only) user — not tenant owner/manager.
set -euo pipefail

BASE_URL="${STAKEHOLDER_FINANCE_BASE_URL:-${BASE_URL:-https://staging.aistroyka.ai}}"
BASE_URL="${BASE_URL%/}"
EMAIL="${STAKEHOLDER_SMOKE_EMAIL:-}"
PASSWORD="${STAKEHOLDER_SMOKE_PASSWORD:-}"

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "BLOCKED: set STAKEHOLDER_SMOKE_EMAIL and STAKEHOLDER_SMOKE_PASSWORD (invited client/stakeholder account)."
  exit 2
fi

COOKIEJAR="$(mktemp)"
cleanup() { rm -f "$COOKIEJAR"; }
trap cleanup EXIT

code="$(curl -sS -c "$COOKIEJAR" -o /tmp/sfs-login.json -w '%{http_code}' -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"traceId\":\"stakeholder-finance-sanity\"}")"
if [[ "$code" != "200" ]]; then
  echo "FAIL: login HTTP $code"
  exit 1
fi

me="$(curl -sS -b "$COOKIEJAR" -H 'Accept: application/json' "$BASE_URL/api/v1/me")"
role="$(python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("data") or {}).get("role") or "")' <<<"$me")"
if [[ "$role" != "stakeholder" ]]; then
  echo "BLOCKED: /api/v1/me role is '$role', expected 'stakeholder' (do not use owner/manager smoke user)."
  exit 2
fi

plist_code="$(curl -sS -b "$COOKIEJAR" -H 'Accept: application/json' -o /tmp/sfs-portal-list.json -w '%{http_code}' "$BASE_URL/api/v1/portal/projects")"
if [[ "$plist_code" == "404" ]]; then
  echo "BLOCKED: GET /api/v1/portal/projects returned 404 — portal API not served on this host (redeploy OpenNext worker or fix routing)."
  exit 3
fi
if [[ "$plist_code" != "200" ]]; then
  echo "FAIL: portal/projects HTTP $plist_code"
  exit 1
fi

pid="$(python3 -c 'import json,sys; j=json.load(sys.stdin); a=j.get("data") or []; print(a[0]["id"] if a else "")' < /tmp/sfs-portal-list.json)"
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

curl -sS -b "$COOKIEJAR" -H 'Accept: application/json' -o /tmp/sfs-portal-proj.json "$BASE_URL/api/v1/portal/projects/$pid"
python3 <<'PY'
import json, sys

DENY_KEYS = frozenset({
    "project_cost_items", "planned_amount", "actual_amount", "margin",
    "profitability", "budget_pressure", "cost_overrun", "subcontractor_cost",
    "internal_cost_item_id", "ai_finance_risk",
})

def walk(obj, path):
    if isinstance(obj, dict):
        for k, v in obj.items():
            kl = k.lower()
            if kl in DENY_KEYS or "internal_cost" in kl:
                print(f"FAIL: forbidden key {path}{k}")
                sys.exit(1)
            walk(v, path + k + ".")
    elif isinstance(obj, list):
        for i, x in enumerate(obj):
            walk(x, path + str(i) + ".")

raw = open("/tmp/sfs-portal-proj.json").read()
try:
    j = json.loads(raw)
except json.JSONDecodeError:
    print("FAIL: portal project response is not JSON")
    sys.exit(1)
walk(j, "")
print("PASS: stakeholder costs denied; portal JSON keys OK")
PY

echo "PASS: stakeholder finance sanity ($BASE_URL, project $pid)"
