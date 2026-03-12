# Phase 7.4 — Worker Lite True Field Ready

**Date:** 2026-03-06  
**Scope:** Background uploads, full report pipeline via operation queue, durable storage. Backend v1 unchanged.

> **Rename (2026-03):** App is now **AiStroyka Worker**; project `ios/AiStroykaWorker`, scheme **AiStroykaWorker**. App delegate is `AiStroykaWorkerAppDelegate`; background URLSession identifier remains `com.aistroyka.workerlite.uploads`. See `docs/IOS_FULL_RENAME_WORKERLITE_TO_AISTROYKAWORKER.md`.

---

## 1. Summary

- **Stage 0:** Baseline gates + report skeleton. Done.
- **Stage 1:** Durable queue storage (atomic JSON, lock, recovery, unit tests). Done.
- **Stage 2:** URLSession background upload service: `BackgroundUploadService` (identifier `com.aistroyka.workerlite.uploads`), taskId↔operationId mapping (JSON), delegate marks uploadBinary op success/failure and reschedules on retry; executor schedules upload via `scheduleUpload` and returns `.deferred`; `WorkerLiteAppDelegate` handles `handleEventsForBackgroundURLSession` and sets completion handler. Done.
- **Stage 3:** Full report pipeline via op queue: `ReportCreateView` only enqueues ops. Create report → per-photo chain (createUploadSession → uploadBinary → finalizeSession → attachMedia) with deps; submitReport depends on createReport + all attachMedia. Deterministic idempotency keys (`draftReportCreateKey` in AppStateStore; per-photo keys in `PendingUploadItem`). UI status from op states; before+after required before Submit. Done.
- **Stage 4:** Executor throttling (5s idle sleep), at most one uploadBinary running at a time, max attempts (8) then `failed_permanent` with “Retry from app”. Done.
- **Stage 5:** Unit tests: recovery from invalid file, concurrent enqueue, dependency ordering, idempotency persistence, submit depends on all attaches. Done.
- **Stage 6:** This report + verification steps. Done.

---

## 2. Setup

Same as Phase 7.3: `ios/Config/Secrets.xcconfig` (BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY). Do not commit. Copy from `ios/Config/Secrets.xcconfig.example` if present.

---

## 3. Verification

### Foreground flow
1. Open WorkerLite, start shift if needed, open Report.
2. Tap “Create report” → draft id appears, createReport op runs, report id appears when op succeeds.
3. Add before photo (camera or library) → createSession → uploadBinary → finalize → attachMedia ops enqueue and run; status shows queued → running → done.
4. Add after photo → same chain.
5. When both show “done”, tap “Submit report” → submitReport op enqueues and runs; “Submitted” appears; draft and pending uploads cleared.

### Offline flow
1. Turn off network (or airplane).
2. Create report, add photos, tap Submit. Ops stay queued.
3. Turn on network → executor runs; ops complete in order. Cockpit shows report and uploads.

### Background flow
1. Create report, add before photo; wait until uploadBinary is running (or queued).
2. Background the app (Home or switch app) for 2–5 minutes.
3. Return to app. Uploads should be completed or retry queued (if network failed). Delegate updates op state when background URLSession completes.

### Kill/relaunch flow
1. Create report, add a photo so uploadBinary is running or queued.
2. Force-kill the app (swipe away or Stop in Xcode).
3. Relaunch. Recreate same URLSession (identifier); load task↔operationId mapping from disk. When system delivers completion, delegate marks op succeeded/failed and runs executor. Queue continues.

### Cockpit validation
- **Reports:** `/dashboard/reports` (or project reports) shows the created report after submit.
- **Uploads:** `/dashboard/uploads` shows the upload sessions / media.
- **Ops overview:** `/api/v1/ops/overview` (or dashboard ops widget) reflects counts.

### Manual test checklist (scripted)
- [ ] Foreground: create report → before → after → submit; see “Submitted”.
- [ ] Offline: create report + photos, go offline, submit; go online → ops complete.
- [ ] Background: start upload, background 2–5 min, return → upload done or retry.
- [ ] Kill during upload, relaunch → queue reconciles (check op states).
- [ ] Cockpit: report and uploads visible after flow.

---

## 4. Gates

- **iOS:** `cd ios/AiStroykaWorker && xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' build`
- **iOS tests:** `xcodebuild -scheme AiStroykaWorker -destination 'id=<simulator-id>' -only-testing:AiStroykaWorkerTests test`
- **Web:** `cd apps/web && bun run test -- --run && bun run cf:build`

---

## 5. Files changed (summary)

- **iOS:** `OperationQueueStore.swift` (lock, backing, atomic persist, recovery, test init), `OperationQueueExecutor.swift` (uploadBinary→deferred, resolve reportId/sessionId from deps, throttle 5s, one upload at a time, max attempts), `BackgroundUploadService.swift` (new), `WorkerLiteAppDelegate.swift` (new), `WorkerLiteApp.swift` (delegate adaptor), `ReportCreateView.swift` (queue-only flow), `AppStateStore.swift` (`draftReportCreateKey`), `WorkerLiteTests.swift` (Stage 1 + Stage 5 tests), `project.pbxproj` (new sources).
- **Docs:** `REPORT-PHASE7-4-BG-UPLOAD-FULL-QUEUE.md` (this file).

---

## 6. Remaining / blockers

- None. Optional: add UI test for report flow in WorkerLiteUITests; background mapping restoration is covered by system reattach + delegate (manual verification).
