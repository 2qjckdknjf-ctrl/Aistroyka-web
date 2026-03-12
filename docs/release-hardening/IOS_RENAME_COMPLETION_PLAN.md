# iOS Worker Lite rename completion plan

## Current state

- **WorkerLite** folder still present; many files deleted (WorkerLiteApp, ContentView, etc.) or replaced (AiStroykaWorkerApp, entitlements).
- **AiStroykaWorker** naming used in new app entry points and tests.
- Risk: Mixed references; build may target wrong or duplicate app.

## If completing rename in repo (conservative)

1. **Do not** auto-rewrite Xcode project XML; high risk of corruption.
2. **Manual Xcode checklist:**
   - Open WorkerLite.xcodeproj.
   - Confirm single app target; display name and bundle ID consistent (e.g. AiStroyka Worker).
   - Remove dead file references (red entries).
   - Ensure scheme points to correct target.
   - Archive and validate on device.
3. **Repo cleanup:** After Xcode is stable, remove any duplicate or obsolete files under WorkerLite that are no longer referenced.
4. **Document** any remaining "WorkerLite" strings that are display-only vs bundle/identity.

## If not safe to auto-complete

- Leave project as-is; document incomplete reference list (e.g. folder name WorkerLite vs product name AiStroyka Worker).
- Pilot with Manager app only until rename is verified in Xcode.

## Recommended

- Prefer manual Xcode steps above; no automated project file edits in this hardening pass.
