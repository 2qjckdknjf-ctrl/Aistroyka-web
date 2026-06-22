# Android Manager / Worker Audit

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Current Structure

Android remains split into:

- `android/AiStroykaManager`
- `android/AiStroykaWorker`
- `android/shared`

This separation must be preserved. Android should not become the primary mobile contour until iOS is product-ready.

## Manager Status

Current Android shared Manager API includes:

- `GET /api/v1/me`
- `GET /api/v1/projects`
- `GET /api/v1/reports`
- `GET /api/v1/reports/:id`
- `PATCH /api/v1/reports/:id`
- `GET /api/v1/ops/overview`
- task detail
- report analysis status
- project media

Android Manager expects `AppRuntime.apiClientProfile = android_manager`, not `android_lite`.

PR #109 compatibility note:

Report review will succeed only for tenant owner/admin or explicit server-side project manager membership. Android Manager must be tested with real role fixtures after the baseline merges.

## Worker Status

Current Android shared Worker API includes:

- config
- projects
- device register/unregister
- worker tasks today
- worker day start/end
- task detail
- report create
- upload session create/finalize
- report media attach
- report submit
- worker sync
- own report detail
- sync bootstrap/changes/ack
- direct Supabase Storage upload

Android Worker sends `android_worker`, which backend treats as field-worker/lite allow-list profile.

## Evidence

Repository evidence:

- `android/README.md` documents Manager/Worker/shared modules.
- `android/shared/src/test/java/ai/aistroyka/shared/SubmitReportBodyTest.kt` covers report submit body null/blank handling.
- `android/AiStroykaWorker/src/androidTest/java/.../WorkerAppLaunchInstrumentedTest.kt` exists as a launch instrumented test.
- `origin/cursor/android-platform-launch-b8bb` contains 89 Android files but is 577 commits behind PR #109 and is not a safe merge source.
- `release/mobile-pilot-rc` contains broad Android app redesign/API/queue work but also overlaps web/API/report changes and must not be merged wholesale.

## Remaining Gaps

- No Android CI workflow equivalent to iOS UI smoke was identified in this audit.
- No current Android build log or Gradle validation was run as part of this docs-only audit.
- No Android emulator runtime smoke evidence was recorded here.
- Google Play readiness is not established.
- Android operation queue and design-system work in `release/mobile-pilot-rc` requires isolated review if still desired.
- Android Manager report review must be revalidated after PR #109 because backend authorization now depends on server-side project manager role, not client profile.

## Android Verdict

Android pilot release safe now: NO.

Android has useful shared API coverage, but release readiness is behind iOS and lacks current build/runtime/publishing evidence. Android parity should be a later, separate PR sequence after iOS post-baseline validation.
