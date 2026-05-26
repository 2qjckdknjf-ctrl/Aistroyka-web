# STAGE 09 — Worker Core Flow End-to-End Report

## 1. Goal

Verify and harden worker core flow contracts across API and iOS Worker client integration.

## 2. Files inspected

### API routes
- `apps/web/app/api/v1/worker/day/start/route.ts`
- `apps/web/app/api/v1/worker/day/end/route.ts`
- `apps/web/app/api/v1/worker/report/create/route.ts`
- `apps/web/app/api/v1/worker/report/add-media/route.ts`
- `apps/web/app/api/v1/worker/report/submit/route.ts`
- `apps/web/app/api/v1/media/upload-sessions/route.ts`
- `apps/web/app/api/v1/media/upload-sessions/[id]/finalize/route.ts`
- `apps/web/app/api/v1/sync/bootstrap/route.ts`
- `apps/web/app/api/v1/sync/changes/route.ts`
- `apps/web/app/api/v1/sync/ack/route.ts`
- `apps/web/app/api/v1/devices/register/route.ts`
- `apps/web/app/api/v1/devices/unregister/route.ts`

### iOS Worker
- `ios/Shared/Sources/Shared/APIClient.swift`
- `ios/Shared/Sources/Shared/Config.swift`
- `ios/Shared/Sources/Shared/AppRuntime.swift`
- `ios/AiStroykaWorker/AiStroykaWorker/RootView.swift`
- `ios/AiStroykaWorker/AiStroykaWorker/Services/WorkerAPI.swift`
- `ios/AiStroykaWorker/AiStroykaWorker/Services/UploadManager.swift`
- `ios/AiStroykaWorker/AiStroykaWorker/Services/SyncService.swift`
- `ios/AiStroykaWorker/AiStroykaWorker/Services/BackgroundUploadService.swift`
- `ios/Config/Secrets.xcconfig.example`

## 3. Findings

1. Worker write routes consistently require tenant context and lite idempotency guard.
2. Sync routes enforce `x-device-id` and return structured `409 sync_conflict` envelopes for retention/device mismatch/ahead-cursor scenarios.
3. Worker submit route enforces schema validation and normalizes worker notes before domain call.
4. iOS Worker client wiring is aligned with expected headers:
   - `Authorization`
   - `x-client: ios_worker`
   - `x-device-id`
   - `x-idempotency-key` for write calls
5. iOS upload flow correctly sequences:
   - create upload session -> storage upload -> finalize -> add-media -> report submit.

## 4. Changes made

1. Added focused test coverage for worker submit route:
   - `apps/web/app/api/v1/worker/report/submit/route.test.ts`
   - validates bad-body rejection and normalized successful submit flow payload.
2. Added operator/runtime E2E script:
   - `docs/publication-readiness/STAGE_09_WORKER_MANUAL_E2E_SCRIPT.md`

## 5. Validation commands

```bash
bun run --cwd apps/web test "app/api/v1/worker/report/submit/route.test.ts" app/api/v1/worker/route.test.ts app/api/v1/media/upload-sessions/route.test.ts "app/api/v1/media/upload-sessions/[id]/finalize/route.test.ts" app/api/v1/sync/bootstrap/route.test.ts app/api/v1/sync/changes/route.test.ts app/api/v1/sync/ack/route.test.ts app/api/v1/devices/register/route.test.ts app/api/v1/devices/unregister/route.test.ts
```

## 6. Validation result

- Focused suite passed (`35/35` tests).
- Contract-level coverage improved for submit route and end-to-end flow components.

## 7. Remaining gaps

1. Live runtime E2E on real worker account/device is not executed in this environment.
2. Full offline queue behavior under network loss/recovery still requires device-level run.

## 8. Blockers

- **PARTIAL (external runtime evidence pending):** requires real worker credentials, tenant data, and iOS runtime/device execution.

## 9. Commit hash

Pending (generated after commit).

## 10. Push status

Pending (will push immediately after stage commit).

## 11. Stage verdict

PARTIAL

