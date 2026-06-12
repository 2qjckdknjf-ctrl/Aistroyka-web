#!/usr/bin/env bash
# Ensure aistroyka.com DNS is proxied through Cloudflare so redirect Worker/Rules can run.
# Does NOT modify aistroyka.ai zone. Requires CLOUDFLARE_API_TOKEN with Zone DNS Edit.
set -euo pipefail

ZONE_NAME="aistroyka.com"
APEX_PLACEHOLDER_IP="192.0.2.1"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "ERROR: CLOUDFLARE_API_TOKEN is required." >&2
  echo "Token must include Zone DNS Edit for aistroyka.com (not just Workers deploy scope)." >&2
  exit 1
fi

api() {
  local method="$1" path="$2"
  shift 2
  curl -sS -X "$method" "https://api.cloudflare.com/client/v4${path}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "$@"
}

ZONE_ID="${CLOUDFLARE_ZONE_ID_AISTROYKA_COM:-}"
if [[ -z "$ZONE_ID" ]]; then
  ZONE_ID="$(api GET "/zones?name=${ZONE_NAME}" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('success') or not d.get('result'):
    raise SystemExit('zone lookup failed: ' + str(d.get('errors')))
print(d['result'][0]['id'])
")"
fi

echo "Zone ${ZONE_NAME}: id=${ZONE_ID:0:4}...${ZONE_ID: -4}"

DNS_JSON="$(api GET "/zones/${ZONE_ID}/dns_records?per_page=200")"
echo "$DNS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('success'):
    raise SystemExit('dns list failed: ' + str(d.get('errors')))
for r in d.get('result',[]):
    prox='proxied' if r.get('proxied') else 'dns-only'
    print(f\"  {r['type']:6} {r['name']:30} -> {r.get('content','')} [{prox}] id={r['id'][:4]}...{r['id'][-4:]}\")
" || exit 1

ensure_apex() {
  local apex_id apex_content apex_proxied
  read -r apex_id apex_content apex_proxied <<<"$(echo "$DNS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for r in d.get('result',[]):
    if r['type']=='A' and r['name'] in ('aistroyka.com', '${ZONE_NAME}'):
        print(r['id'], r.get('content',''), 'true' if r.get('proxied') else 'false')
        break
else:
    print('', '', 'missing')
")"

  if [[ "$apex_proxied" == "missing" ]]; then
    echo "Creating proxied apex A record (${APEX_PLACEHOLDER_IP})..."
    api POST "/zones/${ZONE_ID}/dns_records" --data "$(python3 - <<PY
import json
print(json.dumps({
  'type': 'A', 'name': '@', 'content': '${APEX_PLACEHOLDER_IP}',
  'ttl': 1, 'proxied': True
}))
PY
)" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('success'): raise SystemExit('apex create failed: '+str(d.get('errors')))
print('  created apex A (proxied)')
"
  elif [[ "$apex_proxied" != "true" ]] || [[ "$apex_content" != "$APEX_PLACEHOLDER_IP" ]]; then
    echo "Updating apex A record to proxied ${APEX_PLACEHOLDER_IP} (was ${apex_content}, proxied=${apex_proxied})..."
    api PATCH "/zones/${ZONE_ID}/dns_records/${apex_id}" --data "$(python3 - <<PY
import json
print(json.dumps({
  'type': 'A', 'name': '@', 'content': '${APEX_PLACEHOLDER_IP}',
  'ttl': 1, 'proxied': True
}))
PY
)" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('success'): raise SystemExit('apex update failed: '+str(d.get('errors')))
print('  updated apex A (proxied)')
"
  else
    echo "Apex A record already proxied (${APEX_PLACEHOLDER_IP})."
  fi
}

ensure_www() {
  local www_id www_target www_proxied
  read -r www_id www_target www_proxied <<<"$(echo "$DNS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for r in d.get('result',[]):
    if r['type']=='CNAME' and r['name'] in ('www.aistroyka.com', 'www.${ZONE_NAME}'):
        print(r['id'], r.get('content',''), 'true' if r.get('proxied') else 'false')
        break
else:
    print('', '', 'missing')
")"

  if [[ "$www_proxied" == "missing" ]]; then
    echo "Creating proxied www CNAME -> ${ZONE_NAME}..."
    api POST "/zones/${ZONE_ID}/dns_records" --data "$(python3 - <<PY
import json
print(json.dumps({
  'type': 'CNAME', 'name': 'www', 'content': '${ZONE_NAME}',
  'ttl': 1, 'proxied': True
}))
PY
)" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('success'): raise SystemExit('www create failed: '+str(d.get('errors')))
print('  created www CNAME (proxied)')
"
  elif [[ "$www_proxied" != "true" ]] || [[ "$www_target" != "$ZONE_NAME" ]]; then
    echo "Updating www CNAME -> ${ZONE_NAME} proxied (was ${www_target}, proxied=${www_proxied})..."
    api PATCH "/zones/${ZONE_ID}/dns_records/${www_id}" --data "$(python3 - <<PY
import json
print(json.dumps({
  'type': 'CNAME', 'name': 'www', 'content': '${ZONE_NAME}',
  'ttl': 1, 'proxied': True
}))
PY
)" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('success'): raise SystemExit('www update failed: '+str(d.get('errors')))
print('  updated www CNAME (proxied)')
"
  else
    echo "www CNAME already proxied -> ${ZONE_NAME}."
  fi
}

ensure_apex
ensure_www

echo ""
echo "DNS configuration complete. Waiting 15s for propagation..."
sleep 15

echo ""
echo "=== Validation ==="
fail=0
check() {
  local url="$1" expect_loc="$2"
  echo "--- curl -I $url ---"
  out="$(curl -sI --max-time 20 "$url" 2>&1 || true)"
  echo "$out" | grep -iE '^(HTTP|location|server|cf-ray)' || echo "(no headers)"
  status="$(echo "$out" | awk '/^HTTP/{print $2; exit}')"
  loc="$(echo "$out" | awk 'tolower($1)=="location:"{print $2; exit}' | tr -d '\r')"
  if [[ "$status" != "301" ]]; then
    echo "  FAIL: expected HTTP 301, got ${status:-none}"
    fail=1
  elif [[ -n "$expect_loc" && "$loc" != "$expect_loc" ]]; then
    echo "  FAIL: expected Location $expect_loc, got ${loc:-none}"
    fail=1
  else
    echo "  OK"
  fi
}

check "http://aistroyka.com" "https://aistroyka.ai/"
check "https://aistroyka.com" "https://aistroyka.ai/"
check "http://www.aistroyka.com" "https://aistroyka.ai/"
check "https://www.aistroyka.com" "https://aistroyka.ai/"
check "https://aistroyka.com/pricing?x=1" "https://aistroyka.ai/pricing?x=1"
check "https://www.aistroyka.com/contact?source=test" "https://aistroyka.ai/contact?source=test"

primary="$(curl -sI --max-time 20 https://aistroyka.ai 2>&1 | grep -iE '^(HTTP|location|server)' || true)"
echo "--- curl -I https://aistroyka.ai (must not redirect to .com) ---"
echo "$primary"
if echo "$primary" | grep -qi 'location:.*aistroyka\.com'; then
  echo "  FAIL: primary domain redirects to .com"
  fail=1
else
  echo "  OK: primary domain not redirecting to .com"
fi

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "Validation incomplete — DNS may still be propagating. Re-run curl in a few minutes."
  exit 1
fi

echo ""
echo "All redirect checks passed."
