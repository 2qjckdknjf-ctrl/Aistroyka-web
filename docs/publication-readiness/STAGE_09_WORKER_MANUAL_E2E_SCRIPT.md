# Stage 09 Worker Manual E2E Script

Use this script when device/runtime credentials are available.

## Prerequisites

- Worker user credentials for target tenant.
- `BASE_URL` points to target env.
- `ACCESS_TOKEN` is a real Supabase user JWT.
- `DEVICE_ID` is a stable device identifier.

## Headers

```bash
AUTH="Authorization: Bearer $ACCESS_TOKEN"
CLIENT="x-client: ios_worker"
DEVICE="x-device-id: $DEVICE_ID"
JSON="Content-Type: application/json"
```

## 1) Day start

```bash
curl -i "$BASE_URL/api/v1/worker/day/start" \
  -H "$AUTH" -H "$CLIENT" -H "$DEVICE" -H "$JSON" \
  -H "x-idempotency-key: worker-day-start-1" \
  -d '{}'
```

## 2) Create report

```bash
curl -i "$BASE_URL/api/v1/worker/report/create" \
  -H "$AUTH" -H "$CLIENT" -H "$DEVICE" -H "$JSON" \
  -H "x-idempotency-key: worker-report-create-1" \
  -d '{"task_id":"<TASK_ID>"}'
```

Capture `report_id`.

## 3) Create upload session

```bash
curl -i "$BASE_URL/api/v1/media/upload-sessions" \
  -H "$AUTH" -H "$CLIENT" -H "$DEVICE" -H "$JSON" \
  -H "x-idempotency-key: worker-upload-session-1" \
  -d '{"purpose":"report_before"}'
```

Capture `session_id` and `upload_path`.

## 4) Upload binary to Supabase Storage

Upload image to path returned by session under `media` bucket, then finalize:

```bash
curl -i "$BASE_URL/api/v1/media/upload-sessions/<SESSION_ID>/finalize" \
  -H "$AUTH" -H "$CLIENT" -H "$DEVICE" -H "$JSON" \
  -H "x-idempotency-key: worker-upload-finalize-1" \
  -d '{"object_path":"media/<UPLOAD_PATH>/<FILENAME>.jpg","mime_type":"image/jpeg","size_bytes":12345}'
```

## 5) Attach media to report

```bash
curl -i "$BASE_URL/api/v1/worker/report/add-media" \
  -H "$AUTH" -H "$CLIENT" -H "$DEVICE" -H "$JSON" \
  -H "x-idempotency-key: worker-add-media-1" \
  -d '{"report_id":"<REPORT_ID>","upload_session_id":"<SESSION_ID>"}'
```

## 6) Submit report

```bash
curl -i "$BASE_URL/api/v1/worker/report/submit" \
  -H "$AUTH" -H "$CLIENT" -H "$DEVICE" -H "$JSON" \
  -H "x-idempotency-key: worker-submit-1" \
  -d '{"report_id":"<REPORT_ID>","task_id":"<TASK_ID>","worker_note":"Field update"}'
```

## 7) Sync bootstrap / changes / ack

```bash
curl -i "$BASE_URL/api/v1/sync/bootstrap" -H "$AUTH" -H "$CLIENT" -H "$DEVICE"
curl -i "$BASE_URL/api/v1/sync/changes?cursor=0&limit=100" -H "$AUTH" -H "$CLIENT" -H "$DEVICE"
curl -i "$BASE_URL/api/v1/sync/ack" \
  -H "$AUTH" -H "$CLIENT" -H "$DEVICE" -H "$JSON" \
  -H "x-idempotency-key: worker-sync-ack-1" \
  -d '{"cursor":<NEXT_CURSOR>}'
```

## 8) Device register / unregister

```bash
curl -i "$BASE_URL/api/v1/devices/register" \
  -H "$AUTH" -H "$CLIENT" -H "$DEVICE" -H "$JSON" \
  -H "x-idempotency-key: worker-device-register-1" \
  -d '{"device_id":"'"$DEVICE_ID"'","platform":"ios","token":"<APNS_TOKEN>"}'

curl -i "$BASE_URL/api/v1/devices/unregister" \
  -H "$AUTH" -H "$CLIENT" -H "$DEVICE" -H "$JSON" \
  -H "x-idempotency-key: worker-device-unregister-1" \
  -d '{"device_id":"'"$DEVICE_ID"'"}'
```

