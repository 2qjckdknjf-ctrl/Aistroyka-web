# iOS Build Warnings Fix Report — WorkerLite

**Date:** 2025-03-06  
**Target:** WorkerLite (iOS)  
**Scope:** Technical cleanup only — no business logic, API, or architecture changes.

---

## Fixed Warnings Summary

### Orientation / target validation
- **Issue:** “All interface orientations must be supported unless the app requires full screen.”
- **Fix:** Added `UIRequiresFullScreen` = `true` to the app’s `Info.plist` (WorkerLite/Info.plist). The app does not require split view, so requiring full screen is correct. iPhone orientations (Portrait, Landscape Left, Landscape Right) were already set and left unchanged.

### Unused variables removed
- **LocalReminderService.swift**
  - `scheduleSubmitReminder`: Replaced `guard ..., let dayId = dayId else { return }` with `guard ..., dayId != nil else { return }` so the unwrapped value is not declared when unused.
  - `scheduleAfterPhotoReminder`: Replaced `guard let draftId = state.draftReportId else { return }` with `guard state.draftReportId != nil else { return }` because `draftId` was never used.
- **ReportCreateView.swift**
  - In `onChange(of: beforeImage)` and `onChange(of: afterImage)`: Replaced `guard let img = new, let did = draftId, ...` with `guard let img = new, draftId != nil, ...` so the unused `did` binding was removed (two locations).

### Optional interpolation fixed
- **SyncService.swift**
  - Replaced `"Sync conflict (hint: \(err.body.serverCursor))"` with `"Sync conflict (hint: \(err.body.serverCursor ?? 0))"` so the optional `serverCursor` is not interpolated as a debug description.

---

## Files Modified

| File | Changes |
|------|--------|
| `ios/WorkerLite/Info.plist` | Added `UIRequiresFullScreen` = true. |
| `ios/WorkerLite/WorkerLite/Services/LocalReminderService.swift` | Replaced two optional bindings with nil checks where the bound value was unused. |
| `ios/WorkerLite/WorkerLite/Views/ReportCreateView.swift` | Replaced two `let did = draftId` guards with `draftId != nil` in image onChange handlers. |
| `ios/WorkerLite/WorkerLite/Services/SyncService.swift` | Fixed optional string interpolation in sync conflict error message. |

---

## Build Status

- **Warnings:** 0  
- **Errors:** 0  
- **Build:** Succeeded (clean build, Debug, iOS Simulator iPhone 16)  
- **Target validation:** Passed (Validate step ran successfully)  
- **Launch:** App builds and is launchable (no runtime changes; launch not re-tested in this pass)

---

## Validation Command

```bash
cd ios/WorkerLite
xcodebuild -scheme WorkerLite -destination 'platform=iOS Simulator,name=iPhone 16' -configuration Debug clean build
```

Result: **BUILD SUCCEEDED** with no warning or error output.

---

## Security and Bug Fixes (follow-up)

### Bug 1 — Hardcoded Supabase credentials
- **Issue:** `ios/WorkerLite/WorkerLite/Info.plist` contained real `SUPABASE_URL` and `SUPABASE_ANON_KEY` strings, which would be embedded in the app binary.
- **Fix:** Replaced with build variable substitution: `$(SUPABASE_URL)` and `$(SUPABASE_ANON_KEY)`. Values must be set via `Config/Secrets.xcconfig` (see `Config/Config.example.xcconfig`) or Scheme → Run → Environment. Do not commit real values.

### Bug 2 — Exponential backoff always 1.0
- **Issue:** `BackgroundUploadService.nextAttemptDate` used `pow(1.0, Double(attempt))`, which is always 1.0, so delays did not increase. `OperationQueueExecutor` used `baseBackoffSeconds = 1.0`, so `pow(1, attempt)` was also 1.
- **Fix:** `BackgroundUploadService`: use `pow(2.0, Double(attempt))` (+ jitter, capped at 300s). `OperationQueueExecutor`: set `baseBackoffSeconds = 2.0` so backoff grows (2^attempt seconds + jitter).

### Bug 3 — Duplicate iOS source files
- **Issue:** Swift sources existed in both `ios/WorkerLite/` (root) and `ios/WorkerLite/WorkerLite/`. The Xcode target compiles only from the `WorkerLite/` group; the root-level copies could cause duplicate symbol errors if ever added to the target.
- **Fix:** Removed duplicate files at `ios/WorkerLite/`: `AppState.swift`, `RootView.swift`, `WorkerLiteApp.swift`, and the entire `Core/`, `Networking/`, `Services/`, `Views/` trees. Canonical sources remain under `ios/WorkerLite/WorkerLite/`.

### Bug 4 & 5 — Sync JSON decoding (snake_case)
- **Issue:** (4) `SyncConflictBody` used CodingKey `serverCursor = "serverCursor"`; if the API sent `server_cursor`, decoding would fail. (5) `SyncChangesResponse` used explicit `nextCursor = "nextCursor"` while `syncChanges` used `.convertFromSnakeCase`, so a snake_case `next_cursor` response would not match.
- **Fix:** (4) `SyncConflictBody` CodingKeys: `serverCursor = "server_cursor"`. (5) `SyncChangesResponse` CodingKeys: `nextCursor = "next_cursor"`; decode with plain `JSONDecoder()` (no `convertFromSnakeCase`). Web API updated to return snake_case: sync 409 body uses `server_cursor`, and sync/changes response uses `next_cursor` and `server_time`. Tests updated accordingly.
