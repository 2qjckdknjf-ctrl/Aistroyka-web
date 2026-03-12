# Phase 7.1 — Worker Lite iOS MVP (Pilot-ready)

**Date:** 2026-03-06  
**Scope:** Runnable iOS Worker Lite app (SwiftUI): auth, project picker, shift, report, 2 photos (before/after), upload flow, submit. Backend contracts unchanged.

> **Rename (2026-03):** The app is now branded **AiStroyka Worker**; project path is `ios/AiStroykaWorker`, scheme **AiStroykaWorker**. See `docs/IOS_FULL_RENAME_WORKERLITE_TO_AISTROYKAWORKER.md`.

---

## 1. Summary

- **iOS app:** Implemented under `ios/AiStroykaWorker` (formerly `ios/WorkerLite`) with Xcode project `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`. SwiftUI, iOS 17+. Display name: **AiStroyka Worker**.
- **Flow:** Login (Supabase email/password) → Project picker (or auto-select if one) → Home (Start/End shift, New report) → Create report → Add before/after photos (picker) → Upload (session → Storage → finalize → add-media) → Submit.
- **Headers:** All requests send `x-device-id`; all writes send `x-idempotency-key`. Bearer token from Supabase session.
- **Backend:** No API changes; uses Phase 7.0 endpoints and upload contract.

---

## 2. Build and run (iOS)

### 2.1 Prerequisites

- Xcode 15+ (recommended 16+), iOS 17+ simulator or device.
- Copy `ios/Config/Config.example.xcconfig` to `ios/Config/Secrets.xcconfig` (or set env in Scheme) and set:
  - `BASE_URL` — API base (e.g. `http://localhost:3000` or `https://aistroyka.ai`)
  - `SUPABASE_URL` — Supabase project URL
  - `SUPABASE_ANON_KEY` — Supabase anon key  
  Do not commit real secrets; add `Secrets.xcconfig` to `.gitignore` if needed.

### 2.2 Open and run

1. Open: `open ios/WorkerLite/WorkerLite.xcodeproj` (from repo root).
2. Select scheme **WorkerLite**, choose iPhone simulator or device.
3. Product → Build (⌘B), then Run (⌘R).

CLI build (optional):

```bash
cd ios/AiStroykaWorker && xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' -configuration Debug build
```

### 2.3 Config

- **Info.plist** reads `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` from build settings (xcconfig).
- Defaults: `BASE_URL` falls back to `http://localhost:3000` in code if unset; Supabase keys must be set for auth and storage.

---

## 3. Endpoints and headers

| Action            | Method | Endpoint                              | Headers / body |
|------------------|--------|----------------------------------------|----------------|
| Config           | GET    | `/api/v1/config`                       | `x-device-id`, `x-client: ios_lite`, Bearer |
| Projects         | GET    | `/api/v1/projects`                     | same |
| Start shift      | POST   | `/api/v1/worker/day/start`            | + `x-idempotency-key`, body optional |
| End shift        | POST   | `/api/v1/worker/day/end`              | + `x-idempotency-key` |
| Create report    | POST   | `/api/v1/worker/report/create`        | + `x-idempotency-key`, body `{ "day_id"?: string }` |
| Add media        | POST   | `/api/v1/worker/report/add-media`     | + `x-idempotency-key`, body `{ "report_id", "upload_session_id" }` |
| Submit report    | POST   | `/api/v1/worker/report/submit`        | + `x-idempotency-key`, body `{ "report_id" }` |
| Create session   | POST   | `/api/v1/media/upload-sessions`        | + `x-idempotency-key`, body `{ "purpose": "report_before" \| "report_after" \| "project_media" }` |
| Finalize session | POST   | `/api/v1/media/upload-sessions/:id/finalize` | + `x-idempotency-key`, body `{ "object_path", "mime_type?", "size_bytes?" }` |

Upload binary: Supabase Storage bucket `media`, path `<tenantId>/<sessionId>/<filename>`. `object_path` in finalize = `media/<tenantId>/<sessionId>/<filename>`.

---

## 4. Pilot click-path (verification)

1. **Login** — Enter email/password; Sign In. Session stored in Keychain; app shows Home.
2. **Project** — If multiple projects, select one; if one, auto-selected.
3. **Home** — Start shift → End shift (optional). New report → navigates to report flow.
4. **Report** — Tap "Create report"; then "Before photo" and "After photo" (Photos picker). Each photo: create session → upload to Storage → finalize → add-media. UI shows phase (creatingSession, uploading, finalizing, attaching, done) and Retry on failure.
5. **Submit** — When both photos show "done", tap "Submit report". Success message.
6. **Cockpit** — In web: `/dashboard/reports` (report appears), `/dashboard/uploads` (sessions), ops overview KPIs as expected.

---

## 5. iOS implementation notes

- **Screens:** `LoginView`, `ProjectPickerView`, `HomeView`, `ReportCreateView`, `ImagePicker` (PhotosUI).
- **Core:** `Config` (base URL, Supabase from Info.plist/env), `KeychainHelper` (device ID + session), `DeviceContext` (deviceId, newIdempotencyKey()), `APIError` (typed from response).
- **Networking:** `APIClient` (actor; adds x-device-id, x-client, Bearer, x-idempotency-key for writes), `WorkerAPI` (endpoint helpers), `Endpoints` (DTOs).
- **Auth:** `AuthService` (Supabase REST: token?grant_type=password), session in Keychain, `getAccessToken()` for API.
- **Upload:** `UploadManager` (create session → upload to Supabase Storage → finalize → add-media; per-photo state and retry with same idempotency keys).

---

## 6. Verification pack

- **Backend smoke:** `BASE_URL=... bash apps/web/scripts/smoke/pilot.sh` (health; optional AUTH_HEADER for ops/metrics, CRON_SECRET for cron-tick).
- **iOS verification:** Create one report with 2 photos and submit; confirm in cockpit reports and uploads.

---

## 7. Known issues and next steps

| Item | Notes |
|------|--------|
| **Offline queue (Stage 6)** | Minimal queue (persist + replay with idempotency) not implemented; P1 for Phase 7.2. |
| **Sync client (Stage 7)** | bootstrap/changes/ack and 409 must_bootstrap not implemented; optional for pilot. |
| **Shift state** | Start/End shift state is in-memory only; no persistence across app restarts. |
| **Asset catalog** | AppIcon/AccentColor may need assets in Xcode to avoid build warnings. |
| **Supabase Storage** | Upload uses REST POST to `/storage/v1/object/media/{path}`; if 401/403, confirm RLS allows authenticated upload to `media` bucket for path `tenantId/sessionId/*`. |

**Phase 7.2:** Offline queue, optional sync client, shift state persistence, pilot hardening.

---

## 8. Backend gates

- `cd apps/web && bun run test -- --run` — **pass** (no API changes).
- `cd apps/web && bun run cf:build` — run locally to confirm (no API changes).

---

## 9. References

- **Phase 7.0:** `docs/REPORT-PHASE7-0-WORKER-LITE.md`
- **Pilot config:** `docs/operations/PILOT_MODE_CONFIG.md`
- **Uploads:** `docs/runbooks/MOBILE_UPLOADS.md`
- **Sync:** `docs/runbooks/MOBILE_SYNC.md`
