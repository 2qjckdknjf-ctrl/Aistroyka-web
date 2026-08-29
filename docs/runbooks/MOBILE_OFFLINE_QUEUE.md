# iOS Worker — offline operation queue

**Scope:** **AiStroykaWorker** (field app). **AiStroykaManager** does not use this queue; it uses online session APIs and `NetworkMonitor` to block sign-in when offline.

**Related**

- [MOBILE_SYNC.md](./MOBILE_SYNC.md) — bootstrap / changes / ack and **409** handling. Queued work that advances the device cursor must follow that runbook after a conflict.
- Phase notes: `docs/REPORT-PHASE7-3-FIELD-READY.md`, `docs/REPORT-PHASE7-4-BG-UPLOAD-FULL-QUEUE.md`.

## What it does

1. **Persist** — Critical writes are stored as JSON in Application Support:  
   `Application Support/AiStroykaWorker/operations.json` (see `OperationQueueStore`).
2. **Serialize** — `OperationQueueExecutor` runs **one runnable operation at a time** (with an extra throttle for `uploadBinary`: at most one concurrent upload op).
3. **Dependencies** — Operations declare `dependsOn` op ids; the executor only runs an op when all dependencies have **succeeded**.
4. **Network** — When `NetworkMonitor` says the device is offline, the loop idles; when connectivity returns, `onBecameReachable` resumes the loop.
5. **Backoff** — Transient failures become `queued` again with `nextAttemptAt` (exponential backoff, capped attempts → `failed_permanent`).

## Executor outcomes (high level)

| Outcome | Client behavior |
|--------|------------------|
| Success | Op marked `succeeded`; dependent ops may run. |
| Retry | Re-queue with backoff. |
| Permanent failure | `failed_permanent` (bad payload, etc.). |
| Auth (401/403) | Queue **paused** (`isPaused`); op re-queued until the user re-auths. |
| **409 / sync conflict** | `needsBootstrap = true`; op re-queued — **run sync bootstrap** (see MOBILE_SYNC) before expecting forward progress. |

## Operation types (Worker)

Defined in `OperationType` (`ios/AiStroykaWorker/.../Persistence/Operation.swift`):

| Type | Purpose |
|------|---------|
| `startShift` / `endShift` | Worker day boundaries |
| `createReport` | Create draft report |
| `createUploadSession` / `uploadBinary` / `finalizeSession` / `attachMedia` | Report media pipeline |
| `submitReport` | Submit report (+ optional `workerNote`) |
| `syncAck` | Advance sync cursor after bootstrap/changes |
| `sendTaskMessage` | Offline **text** task-chat send |

Treat the table as the current enum; product flows may not enqueue every type in every release.

### `sendTaskMessage` (task chat)

- **When:** Worker sends a text message from task chat while offline (or the send is queued for durability). Enqueued from `TaskDetailView` with `taskId`, `messageBody`, `clientId`, and an idempotency key.
- **Execute:** `OperationQueueExecutor` calls `TaskMessagesAPI.sendText` → `POST /api/v1/tasks/:id/messages` with `kind: "text"`, `clientId`, and `x-idempotency-key`.
- **Payload required:** `taskId`, `messageBody`, `clientId`. Missing fields → `failed_permanent`.
- **Media:** Voice / photo / video are **not** queued offline; Shared `TaskChatView` surfaces `task_chat_media_offline` and requires connectivity (upload-session finalize needs live network + positive `size_bytes`).
- **Replay:** Server dedupes on `(tenant, task, sender, clientId)` and also honors route idempotency — safe to retry after reconnect.
- **Conflicts:** HTTP **409** still sets `needsBootstrap` like other ops; run sync bootstrap before expecting the chat send to finish.

See [`../API-v1-ENDPOINTS.md#task-chat`](../API-v1-ENDPOINTS.md#task-chat) and [`../mobile-ios/TASK_CHAT_FEATURE_NOTE.md`](../mobile-ios/TASK_CHAT_FEATURE_NOTE.md).

## Manual verification

1. Log in, ensure project selected, open **Home** (queue + sync status).
2. Enable **Airplane mode** (or revoke network), perform an action that enqueues (e.g. shift, report flow, or **task chat text**).
3. Confirm **Pending** count increases and executor stops advancing.
4. Restore network — pending ops should drain; sync status should return to normal unless **409** recovery is required.
5. **Task chat:** offline text should appear for Manager after reconnect; attempting voice/photo/video offline should show the media-offline message and not enqueue.

## UI tests (cold start)

Worker normalizes launch for XCTest when **`AISTROYKA_UI_TEST=1`** (intro complete + sign-out). See `UITestLaunchHooks.swift` and `ios-ui-smoke` workflow. Simulator **UDID** selection is shared with local runs: `ios/scripts/ci-pick-iphone-simulator-udid.sh`.
