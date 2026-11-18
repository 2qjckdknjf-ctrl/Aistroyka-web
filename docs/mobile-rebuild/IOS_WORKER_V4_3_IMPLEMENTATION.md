# iOS Worker V4.3 — implementation note

**Date:** 2026-08-25  
**Branch:** `mobile/ios-worker-v4-3`  
**Source package:** `AISTROYKA_IOS_WORKER_V4_3_PACKAGE` (SCREEN_MAP, DESIGN_SYSTEM, 16 renders)

## What shipped

Worker stays the existing SwiftUI app (`AiStroykaWorker` + Shared). V4.3 adds the field tab shell and the 16-screen navigation from the canon package, wired to live Worker APIs.

- Tab bar: Today / Tasks / Camera / Messages / More
- Login: email + Apple + Google + QR invite (E2E IDs preserved). Phone OTP is an optional Worker path, hidden unless `AISTROYKA_PHONE_OTP=1`. It is not a production blocker and Twilio is not required for launch.
- Shift start safety checklist; location stored locally as shift evidence (day start contract remains empty-body)
- Today, tasks, task detail, work-in-progress, before/after camera, daily report, review, manager return
- Issues, documents, messages hub, profile/offline settings
- New lite-safe routes: `GET/POST /api/v1/worker/issues`, `PATCH /api/v1/worker/issues/:id`, `GET /api/v1/worker/documents`, `POST /api/v1/worker/site-join`

## Checks

| Check | Result |
|---|---|
| `xcodebuild` AiStroykaWorker simulator | PASS |
| `WorkerV43UITests` catalog + login + tabs + task/WIP + issues/docs/shift + camera/report/feedback/issue | PASS |
| `WorkerSmokeUITests` login identifiers | PASS |
| Vitest worker issues/documents/site-join/day-start + lite allow-list + issue service | PASS (34) |
| Screens vs renders 01–16 | Structure matches; hero is still a dusk gradient, not a site photo. Preview report/feedback stay local (no live auth error). |

## Remaining blockers (owner-gated)

- TestFlight MODE B: `APPROVE_TESTFLIGHT_UPLOAD` is not `YES`; ASC key/id/issuer unset.
- Live Worker ↔ Manager E2E/push loop was not run: no `ios/Config/.uitest-e2e-credentials`.
- WIP steps stay on-device (no task-progress API — not invented).
- Announcements stay empty (no announcements API — not invented).
- No new push type for issue status; inbox row is enough (`PushMessageType` is closed).
- Android Worker V4.3 is out of scope.

**Shipped:** PR [#256](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/256) on `main`. Staging and production `buildStamp.sha7` = `0e0f3e6`.

**Optional later (not a launch gate):** Worker phone OTP (`AuthService.requestPhoneOtp` / `verifyPhoneOtp`) may be re-enabled if product demand justifies it, after a real SMS provider is configured and `external_phone_enabled=true`. Twilio setup is **not** an owner-gated launch requirement. Do not add `TWILIO_*` env, CI secrets, or fake credentials.

**Verdict: NO** for live E2E + TestFlight (owner-gated). **YES** for catalog UITest, login smoke, closable code tails, screens 01–16 vs renders, and production deploy of the Worker V4.3 APIs. Phone OTP is optional and currently disabled.

## Not claimed

- Pixel-match of all 16 renders
- Production GA / TestFlight upload
- Android Worker V4.3
