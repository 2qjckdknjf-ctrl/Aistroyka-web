# P1 Worker Stub Closure Report

Date: 2026-04-25

## Scope

Closed the fourth concrete P1 blocker from `PRODUCTION_RUNTIME_TRUTH_AUDIT.md`: `/api/v1/worker` returned an unexplained `501 worker_stub` even though canonical worker runtime routes already existed under explicit subpaths.

This was not a worker feature sprint, mobile expansion, or backend rewrite.

## Files Inspected

- `apps/web/app/api/v1/worker/route.ts`
- `ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift`
- `ios/Shared/Sources/Shared/APIClient.swift`
- `android/shared/src/main/java/ai/aistroyka/shared/WorkerApi.kt`
- `android/shared/src/main/java/ai/aistroyka/shared/ApiClient.kt`
- `packages/api-client/src/client.ts`
- `packages/contracts/src/schemas/worker.schema.ts`
- `packages/contracts-openapi/build-openapi.ts`
- `scripts/smoke/*`
- `scripts/mobile/*`
- `apps/web/lib/api/lite-allow-list.ts`
- `apps/web/lib/api/lite-allow-list.test.ts`
- Worker-related docs under `docs/release1`, `docs/launch`, `docs/audit`, `docs/execution`, `docs/final`, and repository/API maps.

## Client Usage Inventory

- iOS Worker does not call bare `/api/v1/worker`.
  - It calls `config`, `projects`, `worker/tasks/today`, `worker/day/start`, `worker/day/end`, `worker/report/create`, `worker/report/add-media`, `worker/report/submit`, `media/upload-sessions`, `sync/bootstrap`, `sync/changes`, and `sync/ack`.
- Android Worker does not call bare `/api/v1/worker`.
  - It calls `config`, `projects`, `worker/tasks/today`, `worker/report/create`, `worker/report/add-media`, `worker/report/submit`, and `media/upload-sessions`.
- `packages/api-client` does not expose bare `/api/v1/worker`.
  - It exposes `worker.tasksToday()` and `worker.sync()`.
- OpenAPI/contracts do not document bare `/api/v1/worker` as an action endpoint.
  - They document worker subroutes such as `worker/tasks/today` and `worker/sync`.
- Smoke scripts do not call bare `/api/v1/worker`.
  - They call worker report subroutes.
- Docs mention bare `/api/v1/worker` as an existing/stub/allowed surface and explicitly call out the `501` as confusing.
- Lite client allow-list permits `/api/v1/worker` because it allows the worker namespace prefix.

## Pre-Change Answers

1. `/api/v1/worker` is not actually called by current iOS, Android, typed API client, or smoke scripts.
2. It is documented as an existing route in repository/API maps and audit docs, but as a stub/confusing surface rather than a worker action.
3. It is not needed for current bootstrap/discovery; current bootstrap uses `/api/v1/config`, `/api/v1/projects`, `/api/v1/sync/bootstrap`, and worker subroutes.
4. It is safe to keep as a compatibility endpoint because it is a canonical v1 namespace and already passes lite-client surface gating.
5. `GET` should return public, non-tenant discovery guidance for canonical worker routes.
6. `POST` should return `405 method_not_allowed` with canonical route guidance, not create ambiguous behavior and not return `501`.

## Decision

Decision chosen: Option A — Compatibility discovery endpoint.

Why:

- Deleting the route would risk breaking namespace/discovery expectations from docs and allow-list behavior.
- Keeping `501` left a canonical v1 route looking broken.
- A public static discovery response is safe because it does not query DB, authenticate, expose tenant/user data, or mutate state.
- `POST` must stay non-actionable because there is no single canonical worker action for bare `/api/v1/worker`.

## Files Changed

- `apps/web/app/api/v1/worker/route.ts`
  - Replaced `501 worker_stub` GET with `200` compatibility discovery response.
  - Replaced `501 worker_stub` POST with `405 method_not_allowed`.
  - Added `Allow: GET` header for POST.
  - Added static canonical route catalog.
- `apps/web/app/api/v1/worker/route.test.ts`
  - Added focused route tests for GET, POST, and no sensitive data exposure.

## Response Behavior

`GET /api/v1/worker` now returns:

- `ok: true`
- `service: "worker"`
- `status: "available"`
- a compatibility message
- canonical routes for tasks, day start/end, report create/add-media/submit, worker sync, sync bootstrap/changes/ack, upload sessions/finalize, config, and projects.

`POST /api/v1/worker` now returns:

- HTTP `405`
- `Allow: GET`
- `code: "method_not_allowed"`
- canonical route guidance.

## Safety Notes

- No fake worker data was introduced.
- No DB query was added.
- No service role was introduced.
- No auth/tenant context is read.
- The response is static and does not expose tenant IDs, user IDs, Authorization headers, tokens, secrets, or service-role material.
- Existing worker report, task, sync, media, config, and bootstrap routes were not changed.

## Tests Added / Updated

- `apps/web/app/api/v1/worker/route.test.ts`
  - GET no longer returns `501 worker_stub`.
  - GET returns canonical worker route guidance.
  - POST returns `405` and does not silently succeed.
  - Responses do not expose secret/tenant/user material.
- Existing `apps/web/lib/api/lite-allow-list.test.ts` was rerun to confirm lite namespace gating still allows `/api/v1/worker`.

## Validation Commands

- `git status --short --branch --untracked-files=all`
  - Passed; changed files are limited to worker route, worker route test, and this report.
- `bun run --cwd apps/web test "app/api/v1/worker/route.test.ts" "lib/api/lite-allow-list.test.ts"`
  - Passed: 2 files, 17 tests.
- `bun run test`
  - Passed: 234 files, 1295 tests.
- `bun run cf:build`
  - Passed: Next.js build, OpenNext Cloudflare build, and post-build patches completed.
- `bash scripts/release/check-migrations.sh`
  - Passed: 96 migrations.
- `ReadLints`
  - Passed: no linter errors reported for touched files.

## Remaining Risks

- This did not perform a live production smoke call to `/api/v1/worker`; it only validates repository behavior and build output.
- Docs that historically called the endpoint a stub may remain as historical audit records. The current closure report supersedes that runtime status.

## Final Verdict

P1 `/api/v1/worker` stub: CLOSED.

The route no longer returns unexplained `501 worker_stub`, canonical worker routes are clear, POST behavior is explicit and non-ambiguous, existing worker runtime routes are untouched, and validation is green.
