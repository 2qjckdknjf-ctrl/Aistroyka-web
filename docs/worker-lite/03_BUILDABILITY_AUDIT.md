# Worker Lite — Buildability Audit

**Date:** 2025-03-11  
**Branch:** mobile/worker-lite-finalization

## 1. Fixes Applied

| Issue | Fix |
|-------|-----|
| **DiagnosticsView.swift not in target** | Added PBXFileReference, added to Views group, added to Compile Sources for AiStroykaWorker target. |
| **HomeView: cannot find 'appState' in scope** | Added `@EnvironmentObject var appState: AppState` to HomeView so the Support/Diagnostics sheet can pass appState to DiagnosticsView. |
| **WorkerLite.xcodeproj bundle ID** | Normalized to POTA.WorkerLite (see Phase 2). |
| **WorkerLite.xcodeproj PBXBuildFile comment** | Corrected to AiStroykaWorkerApp.swift (see Phase 2). |

## 2. Project Health Summary

- **AiStroykaWorker.xcodeproj:** All file references for the Worker Lite app target point to existing files under ios/AiStroykaWorker/AiStroykaWorker/. Resources (Assets.xcassets, Preview Assets) are in the Resources build phase. Info.plist and entitlements paths are correct. Secrets.xcconfig is referenced from ../Config (ios/Config); file is gitignored and must be provided locally.
- **WorkerLite.xcodeproj:** References the same source via group path ../AiStroykaWorker/AiStroykaWorker. Relative paths resolve when the project is opened from the repo root (ios/WorkerLite). Config path ../Config resolves to ios/Config.

## 3. Build Verification

- **generic/platform=iOS:** Build was attempted; one Swift compile error was fixed (appState in HomeView). After the fix, a full build was not re-run in this environment; simulator destination was unavailable (timeout) and generic build had failed before the fix.
- **Recommended manual verification:** Open `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` in Xcode, select scheme **AiStroykaWorker**, choose a simulator (e.g. iPhone 16), and run Build (⌘B). Ensure `ios/Config/Secrets.xcconfig` exists with at least BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, or set these in the scheme’s Environment variables.

## 4. Remaining Manual Steps (If Build Fails)

1. Create `ios/Config/Secrets.xcconfig` with:
   - BASE_URL = your API base (e.g. https://your-app.vercel.app)
   - SUPABASE_URL = your Supabase project URL
   - SUPABASE_ANON_KEY = your Supabase anon key
2. Or: Edit scheme → Run → Arguments → Environment Variables and add BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY.
3. If signing fails: Select the AiStroykaWorker target → Signing & Capabilities → choose your Team and let Xcode manage provisioning.

## 5. Test Targets

- AiStroykaWorkerTests and AiStroykaWorkerUITests reference the app target correctly (TEST_HOST / TEST_TARGET_NAME). No changes made to test target membership.
