#!/usr/bin/env bash
# Mobile smoke: health, config, bootstrap, create upload session, finalize, create report, submit.
# Usage: BASE_URL=https://... AUTH=<bearer-token> [DEVICE_ID=...] [IDEMPOTENCY_KEY=...] ./scripts/mobile/smoke-mobile.sh

set -e
BASE="${BASE_URL:-http://localhost:3000}"
AUTH="${AUTH:-}"
H="${AUTH_HEADER:-}"
if [ -n "$AUTH" ] && [ -z "$H" ]; then
  H="Authorization: Bearer $AUTH"
fi
DEVICE_ID="${DEVICE_ID:-smoke-device-001}"
IDEM="${IDEMPOTENCY_KEY:-smoke-mobile-$(date +%s)}"

echo "Mobile smoke: $BASE"
if [ -z "$H" ]; then
  echo "  (no AUTH/AUTH_HEADER; only health)"
  curl -sf "${BASE}/api/v1/health" | jq -e '.ok == true' && echo "  health ok" || exit 1
  exit 0
fi

curl -sf "${BASE}/api/v1/health" | jq -e '.ok == true' && echo "  health ok" || exit 1
curl -sf -H "Authorization: $H" "${BASE}/api/v1/config" | jq -e '.serverTime' >/dev/null && echo "  config ok" || true
curl -sf -H "Authorization: $H" -H "x-device-id: $DEVICE_ID" "${BASE}/api/v1/sync/bootstrap" | jq -e '.cursor >= 0' && echo "  bootstrap ok" || exit 1

# Create upload session (lite idempotency)
SESSION_RESP=$(curl -sf -X POST -H "Authorization: $H" -H "Content-Type: application/json" \
  -H "x-idempotency-key: ${IDEM}-create-session" \
  -d '{"purpose":"project_media"}' "${BASE}/api/v1/media/upload-sessions")
SESSION_ID=$(echo "$SESSION_RESP" | jq -r '.data.id')
UPLOAD_PATH=$(echo "$SESSION_RESP" | jq -r '.data.upload_path')
if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
  echo "  create upload session fail"
  exit 1
fi
echo "  upload session created: $SESSION_ID"

# Finalize (object_path = upload_path; no real file upload in smoke)
curl -sf -X POST -H "Authorization: $H" -H "Content-Type: application/json" \
  -H "x-idempotency-key: ${IDEM}-finalize-${SESSION_ID}" \
  -d "{\"object_path\":\"$UPLOAD_PATH\"}" "${BASE}/api/v1/media/upload-sessions/${SESSION_ID}/finalize" | jq -e '.ok == true' && echo "  finalize ok" || exit 1

# Create report
REPORT_RESP=$(curl -sf -X POST -H "Authorization: $H" -H "Content-Type: application/json" \
  -H "x-idempotency-key: ${IDEM}-create-report" \
  -d '{}' "${BASE}/api/v1/worker/report/create")
REPORT_ID=$(echo "$REPORT_RESP" | jq -r '.data.id')
if [ -z "$REPORT_ID" ] || [ "$REPORT_ID" = "null" ]; then
  echo "  create report fail"
  exit 1
fi
echo "  report created: $REPORT_ID"

# Submit report
curl -sf -X POST -H "Authorization: $H" -H "Content-Type: application/json" \
  -H "x-idempotency-key: ${IDEM}-submit-${REPORT_ID}" \
  -d "{\"report_id\":\"$REPORT_ID\"}" "${BASE}/api/v1/worker/report/submit" | jq -e '.reportId' && echo "  submit ok" || exit 1

echo "  mobile smoke done"
