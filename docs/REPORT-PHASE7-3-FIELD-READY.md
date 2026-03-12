# Phase 7.3 — Worker Lite Field-Ready

**Date:** 2026-03-06  
**Scope:** Offline queue, deterministic idempotency, camera, sync UX. Backend v1 unchanged.

> **Rename (2026-03):** App is now **AiStroyka Worker**; project `ios/AiStroykaWorker`, scheme **AiStroykaWorker**. See `docs/IOS_FULL_RENAME_WORKERLITE_TO_AISTROYKAWORKER.md`.

---

## 1. Summary

Phase 7.3 adds field-ready reliability on top of Phase 7.2:

- **Offline operation queue:** All critical writes (start/end shift, create report, upload pipeline, submit, sync ack) can be enqueued as persisted operations. Single executor runs when online, respects dependencies, exponential backoff, 401/403 → pause, 409 → needs bootstrap.
- **Deterministic idempotency:** Shift uses per-day persisted keys (`shiftIdempotencyKeys[dayId]`). Start/end reuse the same key for retries. Upload pipeline keys remain per-item (Phase 7.2).
- **Camera capture:** "Take photo" and "Choose from library" for before/after. Before/after enforced (1+1 for submit).
- **Sync status indicator:** Home shows Synced / Syncing… / Offline / Bootstrap / Error. Sync runs on appear and when network becomes reachable (Phase 7.2 SyncService).
- **Queue UX:** "Pending: N", "Resume queue" / "Pause queue", "Resume uploads" (store pending).

**Deferred:** URLSession background uploads (uploads remain foreground with queue retry). Full report-flow enqueue (createReport, upload chain, submitReport) is executor-ready but report screen still uses direct UploadManager for photos; shift is fully queued.

---

## 2. Configuration

Same as Phase 7.2: `ios/Config/Secrets.xcconfig` with `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Do not commit. `NSCameraUsageDescription` added for camera.

---

## 3. How to run

```bash
open ios/AiStroykaWorker/AiStroykaWorker.xcodeproj
# Scheme AiStroykaWorker → Run (device or simulator)

# CLI build:
cd ios/AiStroykaWorker && xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' build
```

---

## 4. Offline test (manual)

1. Login, select project, tap **Start shift** (enqueues op; executor runs when online and updates shift state).
2. Enable airplane mode. Tap **End shift** (op enqueued; stays queued).
3. Kill app, relaunch. Open Home; queue still has pending op.
4. Disable airplane mode. Executor runs (on appear + network); End shift op runs and completes.
5. Confirm shift ended and "Pending: 0".

---

## 5. Background test (manual)

1. Start a report, add before/after photos (upload starts).
2. Background the app for 2–5 minutes (Home button or swipe).
3. Return to app. Uploads complete or show retry; "Resume uploads" if any pending.

*(Full URLSession background upload task mapping not implemented; resilience is via queue + retry.)*

---

## 6. Cockpit checks

After a full flow (shift → report → 2 photos → submit):

- **Reports:** `/dashboard/reports` — report appears.
- **Uploads:** `/dashboard/uploads` — sessions for the report.
- **Ops:** `/api/v1/ops/overview` or `/api/v1/ops/metrics` (with auth) — KPIs updated.

---

## 7. Gates

- **iOS:** `cd ios/AiStroykaWorker && xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' build` — **pass**
- **Web:** `cd apps/web && bun run test -- --run && bun run cf:build` — **pass**

---

## 8. Runbook (concise)

| Step | Action |
|------|--------|
| Config | Copy `Config.example.xcconfig` → `Secrets.xcconfig`; set BASE_URL, SUPABASE_*; do not commit. |
| Build | Open AiStroykaWorker.xcodeproj → AiStroykaWorker scheme → Build & Run. |
| Pilot | Login → Start shift (queued) → New report → Create report → Before/After (Take photo or Library) → Submit. |
| Offline | Start shift → Airplane on → End shift (queued) → Kill app → Relaunch → Airplane off → queue runs. |
| Cockpit | Check `/dashboard/reports`, `/dashboard/uploads`, `/api/v1/ops/overview`. |

---

## 9. New / changed files (Phase 7.3)

| Path | Purpose |
|------|--------|
| `Persistence/Operation.swift` | Operation type, state, payload, result fields. |
| `Persistence/OperationQueueStore.swift` | Persisted operations (operations.json), runnable/deps. |
| `Services/OperationQueueExecutor.swift` | Run loop, execute by type, backoff, 401/403/409 handling. |
| `Persistence/AppStateStore.swift` | `shiftIdempotencyKeys` per day; CodingKeys for migration. |
| `Views/HomeView.swift` | Queue shift (enqueue start/end with persisted keys), Pending N, Pause/Resume, sync chip. |
| `Views/ReportCreateView.swift` | Take photo / Choose from library (confirmationDialog); camera + library sheets. |
| `Views/CameraPicker.swift` | UIImagePickerController .camera. |
| `Info.plist` | NSCameraUsageDescription. |

---

## 10. References

- Phase 7.2: `docs/REPORT-PHASE7-2-WORKER-LITE-HARDENING.md`
- Sync: `docs/runbooks/MOBILE_SYNC.md`
