# STAGE 14 — iOS Pilot Readiness Report

## 1. Goal

Truthfully classify iOS Worker and Manager pilot readiness with real build/runtime evidence.

## 2. Files inspected

- `ios/README.md`
- `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`
- `ios/AiStroykaManager/AiStroykaManager.xcodeproj`
- `ios/AiStroykaWorker/AiStroykaWorker/Info.plist`
- `ios/AiStroykaManager/AiStroykaManager/Info.plist`
- `ios/Shared/Sources/Shared/APIClient.swift`
- `ios/Shared/Sources/Shared/Config.swift`
- `ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift`

## 3. Build/test commands executed

```bash
xcodebuild -list -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj
xcodebuild -list -project ios/AiStroykaManager/AiStroykaManager.xcodeproj
xcodebuild -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj -scheme AiStroykaWorker -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/AiStroykaManager/AiStroykaManager.xcodeproj -scheme AiStroykaManager -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build
CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh
```

## 4. Results

1. Worker and Manager simulator builds: **PASSED** (xcodebuild exit 0).
2. UI smoke script started and progressed through Worker/Manager UITest build pipeline, but did not finish cleanly in this environment (long-running/hanging execution -> no final pass/fail verdict captured).
3. Config wiring checks:
   - shared API client sets `Authorization`, `x-client`, `x-device-id`, and idempotency headers for write paths
   - base URL and Supabase values are injected via xcconfig/Info.plist placeholders
4. Permissions:
   - Worker has camera and photo library usage descriptions.

## 5. Classification

- **PARTIAL / BUILD_VERIFIED_RUNTIME_PENDING**
- iOS is **not** marked fully pilot-ready yet because end-to-end runtime smoke (login + business flows) is not conclusively closed in this run.

## 6. Required manual operator actions

1. Create/update local secrets file:
   - `cp ios/Config/Secrets.xcconfig.example ios/Config/Secrets.xcconfig`
   - fill real pilot values
2. Run targeted UITest smoke to completion and capture pass evidence:
   - `CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh`
3. Execute manual runtime checklist (worker + manager critical flows) and archive screenshots/videos/logs.

## 7. Artifacts created

- `docs/publication-readiness/IOS_TESTFLIGHT_READINESS_CHECKLIST.md`

## 8. Stage verdict

PARTIAL

