# iOS Manager / Worker Audit

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Current Structure

iOS remains split into:

- `ios/AiStroykaManager/AiStroykaManager.xcodeproj`
- `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`
- `ios/Shared` Swift package

This separation must be preserved.

## Manager Status

Current Manager app API coverage includes:

- `GET /api/v1/me`
- `GET /api/v1/projects`
- `GET /api/v1/tasks`
- `GET /api/v1/reports`
- `GET /api/v1/reports/:id`
- `PATCH /api/v1/reports/:id`
- `GET /api/v1/ops/overview`
- project intelligence and Copilot endpoints
- notifications, devices, activation, and help endpoints

Important PR #109 compatibility note:

`PATCH /api/v1/reports/:id` now requires tenant owner/admin or explicit server-side project manager membership. Manager mobile clients using `ios_manager` are not lite clients, but they still need authoritative tenant/project role state. Generic tenant member is no longer enough.

## Worker Status

Current Worker app API coverage includes:

- `GET /api/v1/projects`
- `GET /api/v1/worker/tasks/today`
- `POST /api/v1/worker/day/start`
- `POST /api/v1/worker/day/end`
- `POST /api/v1/worker/report/create`
- `POST /api/v1/worker/report/add-media`
- `POST /api/v1/worker/report/submit`
- `GET /api/v1/reports/:id` for own report detail
- `GET /api/v1/worker/sync`
- `GET /api/v1/sync/bootstrap`
- `GET /api/v1/sync/changes`
- `POST /api/v1/sync/ack`
- media upload session create/finalize plus Supabase Storage upload
- activation/help endpoints

Worker clients send `x-client: ios_worker`, which is treated as a lite/worker profile in the backend allow-list. This is correct for worker route surface limitation.

## Evidence

Repository evidence:

- `ios/README.md` documents Manager/Worker separation, local UITest smoke, and live Layer B workflow.
- `.github/workflows/ios-ui-smoke.yml` runs Worker and Manager login-surface UITests on iOS path changes.
- `.github/workflows/ios-e2e-integration.yml` defines manual live pilot Layer B E2E.
- `docs/mobile-ios/IOS_E2E_VALIDATION_REPORT.md` records:
  - Layer A smoke coverage.
  - API chain PASS on 2026-06-03.
  - local Layer B UITest PASS on 2026-06-16.
  - GitHub Actions Layer B PASS on 2026-06-17.
- `docs/mobile-ios/IOS_FINAL_MOBILE_READINESS_VERDICT.md` still marks overall iOS as NOT PRODUCT-READY because TestFlight/operator evidence remains partial.

## Remaining Gaps

- Full simulator/photo upload and manager review tap chain still has partial evidence.
- TestFlight archive/upload/Beta Review cycle remains TBD.
- Runtime validation after PR #109 report-review authorization change has not been rerun from iOS Manager.
- Worker resubmit, thumbnail, push, and offline queue drain should be reverified on a post-baseline build candidate.
- No new device/simulator run was performed in this audit.

## iOS Verdict

iOS pilot release safe now: NO.

iOS is the most mature mobile contour, but it still needs a post-baseline Layer B rerun and TestFlight/operator evidence before release claims.
