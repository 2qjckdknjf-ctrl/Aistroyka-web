#!/usr/bin/env bash
# Configure aistroyka.com → aistroyka.ai Single Redirect via Cloudflare Rulesets API.
# Requires CLOUDFLARE_API_TOKEN with Zone DNS Read/Edit + Single Redirect Edit (or Dynamic URL Redirects Write).
set -euo pipefail

ZONE_NAME="aistroyka.com"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "ERROR: CLOUDFLARE_API_TOKEN is required (Single Redirect + DNS permissions)." >&2
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

export NEW_RULE
NEW_RULE="$(python3 - <<'PY'
import json
print(json.dumps({
    "ref": "redirect_com_to_ai",
    "description": "Redirect aistroyka.com to aistroyka.ai",
    "expression": '(http.host eq "aistroyka.com" or http.host eq "www.aistroyka.com")',
    "action": "redirect",
    "action_parameters": {
        "from_value": {
            "target_url": {
                "expression": 'concat("https://aistroyka.ai", http.request.uri.path)'
            },
            "status_code": 301,
            "preserve_query_string": True
        }
    },
    "enabled": True
}))
PY
)"

ENTRY="$(api GET "/zones/${ZONE_ID}/rulesets/phases/http_request_dynamic_redirect/entrypoint")"
SUCCESS="$(echo "$ENTRY" | python3 -c "import json,sys; print(json.load(sys.stdin).get('success'))")"

if [[ "$SUCCESS" == "True" ]]; then
  RULESET_ID="$(echo "$ENTRY" | python3 -c "import json,sys; print(json.load(sys.stdin)['result']['id'])")"
  EXISTING="$(echo "$ENTRY" | python3 -c "
import json,sys
d=json.load(sys.stdin)['result']
for r in d.get('rules',[]):
    if r.get('ref')=='redirect_com_to_ai' or 'aistroyka.ai' in str(r.get('action_parameters',{})):
        print('found')
        break
")"
  if [[ "$EXISTING" == "found" ]]; then
    echo "Equivalent redirect rule already exists in ruleset ${RULESET_ID:0:4}...${RULESET_ID: -4}; no change."
    exit 0
  fi
  MERGED="$(echo "$ENTRY" | python3 -c "
import json,sys,os
entry=json.load(sys.stdin)['result']
new_rule=json.loads(os.environ['NEW_RULE'])
rules=list(entry.get('rules',[]))
rules.append(new_rule)
print(json.dumps({'name': entry.get('name','Redirect rules ruleset'), 'kind': 'zone', 'phase': 'http_request_dynamic_redirect', 'rules': rules}))
")"
  api PUT "/zones/${ZONE_ID}/rulesets/${RULESET_ID}" --data "$MERGED" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('success'):
    raise SystemExit('update ruleset failed: ' + str(d.get('errors')))
print('Updated redirect ruleset.')
"
else
  api POST "/zones/${ZONE_ID}/rulesets" --data "$(python3 - <<PY
import json,os
print(json.dumps({
  'name': 'Redirect rules ruleset',
  'kind': 'zone',
  'phase': 'http_request_dynamic_redirect',
  'rules': [json.loads(os.environ['NEW_RULE'])]
}))
PY
)" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('success'):
    raise SystemExit('create ruleset failed: ' + str(d.get('errors')))
print('Created redirect ruleset.')
"
fi

echo "Done. Validate with: curl -I 'https://aistroyka.com/pricing?x=1'"
