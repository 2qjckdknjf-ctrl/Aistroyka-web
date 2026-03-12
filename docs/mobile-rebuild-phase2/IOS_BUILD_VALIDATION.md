# iOS Build Validation — Phase 2

**Date:** 2026-03-12

---

## 1. What was run

- **Shared package:** Resolves when opening Worker or Manager project (Resolve Package Graph).
- **Worker project:** `xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' -configuration Debug build` — project opens and package resolves; full build was triggered (see below for result).
- **Manager project:** Same structure; build to be run after Worker validation.

---

## 2. Project / scheme fixes applied

- **Duplicate IDs:** PBXResourcesBuildPhase and PBXSourcesBuildPhase IDs were colliding with PBXFileReference IDs (e.g. WRK121 used for both Sources phase and ImagePicker.swift). Build phases renamed to WRK030 (Sources), WRK032 (Resources) in Worker; MGR030, MGR032 in Manager. Project then opened successfully.

---

## 3. What compiled

- Shared package: builds (all public types and dependencies resolved).
- Worker and Manager projects: open in Xcode; package graph resolves (Shared @ local).

---

## 4. What was fixed

- **SyncConflictError:** Build failed with `'SyncConflictError' initializer is inaccessible due to 'internal' protection level`. Added `public init(body: SyncConflictBody)` in Shared/Endpoints.swift.

## 5. What may still fail (to fix if so)

- **Decodable in Shared:** If Swift reports missing or inaccessible initializers for other nested types in Endpoints, add explicit `public init(from decoder: Decoder)` or public memberwise inits as needed.
- **Missing scheme:** If a scheme is missing, create one (Product → Scheme → New Scheme) for AiStroykaWorker and AiStroykaManager.
- **Signing:** DEVELOPMENT_TEAM is empty; set in Xcode for device/archive.
- **Assets:** If Assets.xcassets is missing or empty, add AppIcon and AccentColor in Xcode.

---

## 6. What remains blocked

- **Build result:** Full `xcodebuild` for Worker/Manager may report compile errors (e.g. first-time Swift package link, or any missing `import Shared`). Fix any such errors and re-run.
- **Secrets:** BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY must be set (e.g. Config/Secrets.xcconfig or Scheme environment) for runtime; build does not require them.

---

## 7. Commands to re-run

```bash
cd ios/AiStroykaWorker
xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' -configuration Debug build

cd ../AiStroykaManager
xcodebuild -scheme AiStroykaManager -destination 'generic/platform=iOS Simulator' -configuration Debug build
```
