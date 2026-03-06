# Worker Lite pilot — config and endpoints

Minimal config for running the Worker Lite (iOS) pilot against the web API. No secrets in repo; set in Xcode / Cloudflare / env.

## Required env (app / backend)

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | iOS + Web | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | iOS + Web | Supabase anon key (auth) |
| `NEXT_PUBLIC_APP_URL` | iOS | Base URL of the API (e.g. https://aistroyka.ai or staging) |

## Optional (backend)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Job processing, admin routes, storage |
| `REQUIRE_CRON_SECRET` | If `true`, cron-tick and schedule-reconcile require `x-cron-secret` |
| `CRON_SECRET` | Shared secret for cron/smoke when `REQUIRE_CRON_SECRET=true` |

## Lite-allowed endpoints (x-client: ios_lite)

Use existing v1 contracts; no breaking changes.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/v1/health | Liveness |
| GET | /api/v1/config | Flags, limits, clientProfile |
| GET | /api/v1/sync/bootstrap | Full snapshot + cursor |
| GET | /api/v1/sync/changes?cursor=&limit= | Delta after cursor |
| POST | /api/v1/sync/ack | Persist cursor (body: `{ "cursor": number }`) |
| GET | /api/v1/worker/sync | Lightweight sync (tasks, reports, upload sessions since) |
| GET | /api/v1/projects | List projects (select / auto if single) |
| POST | /api/v1/worker/day/start | Start shift |
| POST | /api/v1/worker/day/end | End shift |
| POST | /api/v1/worker/report/create | Create daily report (body: `{ "day_id"?: string }`) |
| POST | /api/v1/worker/report/add-media | Attach media (body: `{ "report_id", "upload_session_id" \| "media_id" }`) |
| POST | /api/v1/worker/report/submit | Submit report (body: `{ "report_id" }`) |
| POST | /api/v1/media/upload-sessions | Create session (body: `{ "purpose": "project_media" \| "report_before" \| "report_after" }`) |
| POST | /api/v1/media/upload-sessions/:id/finalize | Finalize (body: `{ "object_path", "mime_type?", "size_bytes?" }`) |
| POST | /api/v1/devices/register | Register device for push (when implemented) |

## Lite required headers

- **x-device-id** — All sync and upload flows; stable per device.
- **x-client** — `ios_lite` (or `android_lite`).
- **x-idempotency-key** — For POSTs (sync/ack, report/create, upload-sessions, day/start, day/end, add-media, submit). Use same key on retry.
- **x-app-version** / **x-platform** — Optional; recommended for support.

Auth: Supabase session (Cookie or Authorization: Bearer &lt;access_token&gt;). Tenant from JWT/membership.

## Upload flow (Worker Lite)

1. **Create session** — `POST /api/v1/media/upload-sessions` with `{ "purpose": "report_before" }` or `"report_after"`. Response: `data.upload_path` = `media/<tenantId>/<sessionId>` (bucket path prefix).
2. **Upload binary** — Upload file to Supabase Storage bucket `media` at path `<tenantId>/<sessionId>/<filename>` (or use signed URL if exposed). Use anon or service key per your Storage RLS.
3. **Finalize** — `POST /api/v1/media/upload-sessions/:id/finalize` with `{ "object_path": "media/<tenantId>/<sessionId>/photo.jpg", "mime_type": "image/jpeg", "size_bytes": 12345 }`.
4. **Attach to report** — `POST /api/v1/worker/report/add-media` with `{ "report_id": "<id>", "upload_session_id": "<sessionId>" }`.

If finalize returns session expired: create a new session and re-upload. Retry create/finalize with same idempotency key.

## Sync (offline-first)

- **Bootstrap** when online and no cursor or after 409 with `must_bootstrap: true`. Replace local state with response data; set cursor from response.
- **Changes** to get deltas after cursor; **ack** to persist cursor after applying changes. On 409: adopt `serverCursor`, bootstrap if `must_bootstrap`, then retry.
- **last_seen** — Server updates `device_tokens.last_seen` on successful sync/ack and sync/changes (best-effort). No client change needed.

## Verification

Run pilot smoke (from repo root):

```bash
BASE_URL=https://your-api.example.com bun run smoke:pilot
# With auth (ops/metrics): AUTH_HEADER="Bearer <token>" BASE_URL=... bun run smoke:pilot
# With cron (cron-tick):   CRON_SECRET=... BASE_URL=... bun run smoke:pilot
```

See **docs/REPORT-PHASE7-0-WORKER-LITE.md** for pilot flow and build steps.
