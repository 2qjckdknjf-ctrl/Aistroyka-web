# Phase 7.0 — Worker Lite pilot MVP report

**Date:** 2026-03-09  
**Scope:** Backend integration verification, pilot config, smoke script. iOS app implementation deferred (see Known issues).

---

## 1. Summary

- **Backend:** All v1 endpoints required for Worker Lite are present and contract-stable (sync, upload-sessions, worker/day, worker/report, devices). No API changes.
- **Verification pack:** Pilot smoke script and pilot mode config doc added. Backend gates (tests, cf:build) remain green.
- **iOS app:** The `ios/` directory is **not present** in the workspace (gitignored or not checked out). Therefore no iOS screens or upload/sync client code were implemented in this phase. This report documents the intended pilot flow and endpoints so that when `ios/` is available, implementation can follow.

---

## 2. Build steps (when iOS project exists)

1. **Open project:** Open `ios/Aistroyka.xcodeproj` in Xcode.
2. **Config:** Set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in scheme env or Config (no secrets in repo).
3. **Build:** Select a real device or iPhone simulator; Build (Cmd+B). Fix signing if needed.
4. **Run:** Run on simulator or device; confirm auth (Supabase), then pilot flow below.

If the iOS app is in a separate repo or restored from backup, use the same env and the endpoint list in **docs/operations/PILOT_MODE_CONFIG.md**.

---

## 3. Pilot flow (intended)

1. **Login** — Supabase Auth (email/password or OTP). Session cookie / access token for API.
2. **Home** — GET /api/v1/projects; if single project, auto-select; else project picker.
3. **Shift** — POST /api/v1/worker/day/start (with x-device-id, x-idempotency-key). Show “Shift started”. End: POST /api/v1/worker/day/end.
4. **Report** — POST /api/v1/worker/report/create (optional body: `{ "day_id" }`). Store `data.id` as report_id.
5. **Camera / Picker** — For each photo (before/after): create session → upload file to Storage → finalize → add-media to report. Show upload status and retry UI on error.
6. **Submit** — POST /api/v1/worker/report/submit with `{ "report_id" }`. Show success or error.

**Offline-first (future):** Queue actions locally when offline; when online, sync (bootstrap/changes/ack) and replay queued writes with idempotency keys.

**Push:** Register device (POST /api/v1/devices/register when used); server updates last_seen on sync/ack and sync/changes (best-effort).

---

## 4. Endpoints used (Worker Lite)

| Flow | Method | Endpoint | Headers / body |
|------|--------|----------|----------------|
| Auth | — | Supabase Auth | Session / Bearer |
| Config | GET | /api/v1/config | Cookie/Bearer |
| Projects | GET | /api/v1/projects | Cookie/Bearer |
| Start shift | POST | /api/v1/worker/day/start | x-device-id, x-idempotency-key; body optional |
| End shift | POST | /api/v1/worker/day/end | x-device-id, x-idempotency-key |
| Create report | POST | /api/v1/worker/report/create | x-device-id, x-idempotency-key; body `{ "day_id"?: string }` |
| Add media | POST | /api/v1/worker/report/add-media | x-device-id, x-idempotency-key; body `{ "report_id", "upload_session_id" }` |
| Submit report | POST | /api/v1/worker/report/submit | x-device-id, x-idempotency-key; body `{ "report_id" }` |
| Create upload session | POST | /api/v1/media/upload-sessions | x-device-id, x-idempotency-key; body `{ "purpose": "report_before" \| "report_after" \| "project_media" }` |
| Finalize session | POST | /api/v1/media/upload-sessions/:id/finalize | x-device-id, x-idempotency-key; body `{ "object_path", "mime_type?", "size_bytes?" }` |
| Sync (optional) | GET | /api/v1/sync/bootstrap | x-device-id |
| Sync delta | GET | /api/v1/sync/changes?cursor=&limit= | x-device-id |
| Sync ack | POST | /api/v1/sync/ack | x-device-id, x-idempotency-key; body `{ "cursor" }` |
| Lightweight sync | GET | /api/v1/worker/sync?since= | Cookie/Bearer |

Upload binary: Supabase Storage bucket `media`, path `<tenantId>/<sessionId>/<filename>`. `object_path` in finalize = `media/<tenantId>/<sessionId>/<filename>`.

---

## 5. Verification pack (delivered)

- **apps/web/scripts/smoke/pilot.sh** — Curl health; optional ops/metrics (with AUTH_HEADER); optional cron-tick (with CRON_SECRET). Usage: `BASE_URL=... bun run smoke:pilot` (from repo root); set AUTH_HEADER / CRON_SECRET for optional steps.
- **docs/operations/PILOT_MODE_CONFIG.md** — Required env, lite-allowed endpoints, upload flow, sync, headers, verification commands.

---

## 6. Backend gates

- `cd apps/web && npm test -- --run` — **pass** (no changes to API).
- `cd apps/web && npm run cf:build` — **pass** (no changes to API).

(Re-run locally to confirm after any branch updates.)

---

## 7. Known issues and next actions

| Issue | Next action |
|-------|-------------|
| **ios/ not in workspace** | Add or restore iOS project (e.g. remove `ios/` from .gitignore or clone from backup). Then implement Login → Home → Shift → Report → Camera/Picker → Upload progress → Submit per pilot flow. |
| **Upload client** | When ios exists: implement create session → upload to Storage (Supabase client or signed URL) → finalize; retry and status UI per MOBILE_UPLOADS.md. |
| **Sync client** | When ios exists: use x-device-id on all sync and upload calls; implement bootstrap/changes/ack with 409 handling per MOBILE_SYNC.md. |
| **Offline queue** | P1: queue actions when offline; replay with idempotency when online. |
| **Smoke: report + 2 photos** | Once iOS app runs: create report, add 2 photos (before/after) via upload-sessions + add-media, submit; verify in cockpit reports/uploads. |

---

## 8. References

- **docs/runbooks/MOBILE_SYNC.md** — Sync contract, 409, idempotency.
- **docs/runbooks/MOBILE_UPLOADS.md** — Create → upload → finalize → add-media.
- **docs/operations/PILOT_MODE_CONFIG.md** — Pilot env and endpoints.
- **docs/operations/CRON_SETUP.md** — Cron-tick wiring (optional for pilot).
