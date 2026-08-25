# iOS Worker V4.3 — implementation note

**Date:** 2026-08-25  
**Branch:** `mobile/ios-worker-v4-3`  
**Source package:** `AISTROYKA_IOS_WORKER_V4_3_PACKAGE` (SCREEN_MAP, DESIGN_SYSTEM, 16 renders)

## What shipped

Worker stays the existing SwiftUI app (`AiStroykaWorker` + Shared). V4.3 adds the field tab shell and the 16-screen navigation from the canon package, wired to live Worker APIs.

- Tab bar: Today / Tasks / Camera / Messages / More
- Login: phone OTP + QR invite + existing email/Apple (E2E IDs preserved)
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

## Remaining blockers (owner-gated — not closable in this worktree)

- Staging/production API still serve `main` until this branch is merged and deployed. Live DB already has volume + issue-evidence columns.
- Phone OTP: client calls Supabase `/auth/v1/otp`. This worktree has no `SUPABASE_ACCESS_TOKEN`; live SMS still needs Twilio/MessageBird plus `apps/web/scripts/enable-auth-phone-otp.mjs`.
- TestFlight MODE B: `APPROVE_TESTFLIGHT_UPLOAD` is unset; ASC key/id/issuer unset. Debug device install is not a store upload.
- Live Worker ↔ Manager E2E/push loop was not run: no `ios/Config/.uitest-e2e-credentials` in this worktree, and staging would still be `main`.
- WIP steps stay on-device (no task-progress API — not invented).
- Announcements stay empty (no announcements API — not invented).
- No new push type for issue status; inbox row is enough (`PushMessageType` is closed).
- Android Worker V4.3 is out of scope.

**Verdict: NO** for full prompt closure (deploy + SMS + live E2E + TestFlight still owner-gated). **YES** for catalog UITest, login smoke, closable code tails on this branch, and screens 01–16 vs renders.

## Not claimed

- Pixel-match of all 16 renders
- Production GA / TestFlight upload
- Android Worker V4.3
