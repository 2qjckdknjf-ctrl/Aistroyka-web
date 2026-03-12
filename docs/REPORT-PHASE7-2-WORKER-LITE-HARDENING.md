# Phase 7.2 — Worker Lite Pilot Hardening

**Date:** 2026-03-06  
**Scope:** Offline-first reliability, persistent state, sync client, upload diagnostics, UX for field use. Backend v1 contracts unchanged.

> **Rename (2026-03):** App is now **AiStroyka Worker**; project `ios/AiStroykaWorker`, scheme **AiStroykaWorker**. Persistence dir: `Application Support/AiStroykaWorker/`. See `docs/IOS_FULL_RENAME_WORKERLITE_TO_AISTROYKAWORKER.md`.

---

## 1. Summary

Phase 7.2 adds production-grade reliability to the Phase 7.1 Worker Lite iOS app:

- **Persistent app state:** Shift (dayId, startedAt, endedAt), selected project, draft report id, pending uploads, and sync cursor are stored in `Application Support/AiStroykaWorker/app_state.json` and survive relaunch.
- **Sync client:** `SyncService` implements bootstrap → changes → ack with persisted cursor; on 409 `sync_conflict` with `must_bootstrap: true` it runs bootstrap and retries. Stable idempotency key per cursor for ack.
- **Resume UX:** Home shows "Pending uploads: N" and "Resume uploads" when there are pending items; resume opens report with draft id so the user can retry.
- **Storage diagnostics:** 401/403 from Supabase Storage show: "Storage policy denied. Check Supabase RLS for bucket media and tenant path."
- **Network awareness:** `NetworkMonitor` (NWPathMonitor) exposes `isConnected` for future offline-queue replay; sync runs only when online.

**Not implemented in this phase (deferred):** Full offline operation queue (Stage 2), URLSession background uploads (Stage 3), camera capture (Stage 6), and backend smoke script changes. Backend gates remain green.

---

## 2. Configuration (no secrets committed)

- Copy `ios/Config/Config.example.xcconfig` to `ios/Config/Secrets.xcconfig`.
- Set (do not commit real values):
  - `BASE_URL` — e.g. `https://aistroyka.ai` or `http://localhost:3000`
  - `SUPABASE_URL` — Supabase project URL
  - `SUPABASE_ANON_KEY` — Supabase anon key
- Ensure `ios/Config/Secrets.xcconfig` is in `.gitignore` (and `Secrets.xcconfig` in root `.gitignore` as per Stage 0).

---

## 3. How to run (iOS)

1. Open: `open ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`
2. Select scheme **AiStroykaWorker**, choose an iPhone simulator or device.
3. Product → Build (⌘B), then Run (⌘R).

CLI build:

```bash
cd ios/AiStroykaWorker && xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' -configuration Debug build
```

---

## 4. End-to-end pilot flow

1. **Login** — Email/password; session in Keychain.
2. **Project** — Selected project is persisted; after relaunch the same project is restored.
3. **Home** — Start shift → state is persisted; after kill/relaunch "Shift in progress" is shown. New report → report flow.
4. **Report** — Create report (draft id persisted). Before/After photo (picker). Uploads sync state to store; failures show actionable error (e.g. storage denied).
5. **Resume** — If there are pending uploads, Home shows "Pending uploads: N" and "Resume uploads"; opens report with draft id for retry.
6. **Submit** — On success, draft and pending uploads are cleared from store.

---

## 5. Offline test (manual)

- During upload, enable airplane mode (or disconnect network). Upload will fail; error is shown.
- Re-enable network; use "Resume uploads" to return to the report and use "Retry" on the failed photo. (Full offline queue with automatic replay is deferred to a later stage.)

---

## 6. Cockpit verification

After a successful report submit from the app:

- **Reports:** `/dashboard/reports` — report appears.
- **Uploads:** `/dashboard/uploads` — sessions and metrics (stuck/expired as per backend logic).
- **Ops:** `/api/v1/ops/overview` or `/api/v1/ops/metrics` (with auth) — KPIs and queues as expected.

---

## 7. Backend smoke script

No backend changes required. Usage (unchanged):

```bash
BASE_URL=https://aistroyka.ai bash apps/web/scripts/smoke/pilot.sh
# With auth for ops/metrics:
BASE_URL=... AUTH_HEADER="Bearer <token>" bash apps/web/scripts/smoke/pilot.sh
```

---

## 8. Gates

- **iOS:** `cd ios/AiStroykaWorker && xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' -configuration Debug build` — **pass**
- **Web tests:** `cd apps/web && bun run test -- --run` — **pass**
- **Web build:** `cd apps/web && bun run cf:build` — **pass**

---

## 9. New / modified files (Phase 7.2)

| Path | Purpose |
|------|--------|
| `ios/WorkerLite/WorkerLite/Persistence/AppStateStore.swift` | Persisted state (shift, project, draft, pending uploads, sync cursor); atomic JSON write. |
| `ios/WorkerLite/WorkerLite/Core/NetworkMonitor.swift` | NWPathMonitor; `isConnected`, `onBecameReachable`. |
| `ios/WorkerLite/WorkerLite/Services/SyncService.swift` | Bootstrap, changes, ack; cursor persistence; 409 → bootstrap retry. |
| `ios/WorkerLite/WorkerLite/Networking/Endpoints.swift` | Sync DTOs, `SyncConflictError`. |
| `ios/WorkerLite/WorkerLite/Networking/APIClient.swift` | `requestDataAndResponse` for sync/changes 409 handling. |
| `ios/WorkerLite/WorkerLite/Services/WorkerAPI.swift` | `syncBootstrap`, `syncChanges`, `syncAck`. |
| `ios/WorkerLite/WorkerLite/Views/HomeView.swift` | Shift from store, save on start/end; "Resume uploads" banner. |
| `ios/WorkerLite/WorkerLite/Views/HomeContainerView.swift` | Restore/save `selectedProjectId` from store. |
| `ios/WorkerLite/WorkerLite/Views/ReportCreateView.swift` | `draftReportId` for resume; sync pending uploads to store; clear on submit. |
| `ios/WorkerLite/WorkerLite/Services/UploadManager.swift` | 401/403 storage message; `PhotoUploadItem` `Equatable` and explicit `id`. |

---

## 10. Known issues and remaining pilot work

| Item | Status |
|------|--------|
| **Offline operation queue** | Not implemented; all writes are still inline. Queue with persist + replay + backoff is Stage 2. |
| **Background URLSession uploads** | Not implemented; uploads run in foreground. |
| **Camera capture** | Only Photos picker; "Take photo" option (Stage 6) not added. |
| **Sync indicator in UI** | SyncService runs but no synced/syncing/offline badge in UI yet. |
| **Idempotency per day for shift** | Start/end shift use new idempotency key per tap; persisted per-day key for retries not added. |

---

## 11. References

- Phase 7.1: `docs/REPORT-PHASE7-1-WORKER-LITE-IOS.md`
- Sync runbook: `docs/runbooks/MOBILE_SYNC.md`
- Uploads runbook: `docs/runbooks/MOBILE_UPLOADS.md`
