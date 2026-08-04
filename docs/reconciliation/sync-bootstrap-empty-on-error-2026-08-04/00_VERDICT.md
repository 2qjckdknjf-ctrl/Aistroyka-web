# Sync bootstrap empty-on-error — severity verdict

**Date:** 2026-08-04  
**Branch:** `cursor/critical-bug-investigation-3fa7`  
**Base:** `main` @ `d4589b94`  
**Hypothesis:** If `listForBootstrap` / `listTasksForToday` return `[]` on DB error while `getMaxCursor` still returns a tip cursor, mobile clients REPLACE local tasks/reports with an empty snapshot → data loss / critical UX break.

## Verdict: **NOT CRITICAL**

Server fail-open (empty arrays + tip cursor) is real and is a protocol correctness defect. **Shipped iOS/Android Worker clients do not apply bootstrap `data` at all** — they only persist `cursor`. Therefore the concrete “wipe local snapshot” data-loss path does **not** exist in current product code.

| Question | Answer |
|---|---|
| Severity | **NOT CRITICAL** (latent protocol landmine; becomes CRITICAL if a client implements runbook “replace local snapshot”) |
| Concrete wipe trigger today? | **No** — clients ignore `data` |
| Already fixed on `critical-bug-investigation-*`? | **No** for `/sync/bootstrap` empty-on-error. Related but different fixes live in open PR **#199** |
| Minimal fix clear? | **Yes** (server fail-closed 503) — optional hardening, not emergency |

---

## 1) Server: empty-on-error + tip cursor

### `bootstrap()` coalesces empties and always returns cursor

```26:43:apps/web/lib/sync/sync.service.ts
export async function bootstrap(
  supabase: SupabaseClient,
  ctx: TenantContext,
  _options: { deviceId: string }
): Promise<BootstrapResult> {
  const { data: tasks } = await listTasksForToday(supabase, ctx);
  const reports = await listReportsForBootstrap(supabase, ctx.tenantId, ctx.userId, 100);
  const uploadSessions = await listUploadSessionsForBootstrap(supabase, ctx.tenantId, ctx.userId, 100);
  const cursor = await getMaxCursor(supabase, ctx.tenantId);
  return {
    data: {
      tasks: (tasks ?? []) as unknown as BootstrapResult["data"]["tasks"],
      reports,
      uploadSessions,
    },
    cursor,
    serverTime: new Date().toISOString(),
  };
}
```

- Errors from list helpers are **not** checked.
- `tasks ?? []` treats missing data as empty success.
- Route returns HTTP **200** after schema validation (`apps/web/app/api/v1/sync/bootstrap/route.ts` L32–50).

### Repositories / task service swallow DB errors as `[]`

| Helper | Behavior | Evidence |
|---|---|---|
| `report.repository.listForBootstrap` | `if (error) return []` | `apps/web/lib/domain/reports/report.repository.ts:43` |
| `upload-session.repository.listForBootstrap` | `if (error) return []` | `apps/web/lib/domain/upload-session/upload-session.repository.ts:37` |
| `task.service.listTasksForToday` | `catch { return { data: [], error: null } }` | `apps/web/lib/domain/tasks/task.service.ts:21-23` |
| `task.repository.listTasksForUser` | `if (e1) return []` | `apps/web/lib/domain/tasks/task.repository.ts:26` |
| `getMaxCursor` | On error → `0`; on success → tip id | `apps/web/lib/sync/change-log.repository.ts:80-89` |

**Dangerous combination (server-side):** transient failure on `worker_reports` / `upload_sessions` / `worker_tasks` while `change_log` max-id read succeeds → response:

```json
{ "data": { "tasks": [], "reports": [], "uploadSessions": [] }, "cursor": <high>, "serverTime": "..." }
```

That is a valid `SyncBootstrapResponseSchema` payload (`packages/contracts/src/schemas/sync.schema.ts`).

---

## 2) Mobile apply path: bootstrap `data` is unused

### Runbook expectation (not implemented)

`docs/runbooks/MOBILE_SYNC.md` recovery step 3 says:

> Replace local snapshot with `data` (tasks, reports, uploadSessions).  
> Set local cursor to response `cursor`.

### iOS Worker `SyncService` — cursor only

```75:86:ios/AiStroykaWorker/AiStroykaWorker/Services/SyncService.swift
            if needsBootstrap {
                do {
                    let result = try await WorkerAPI.syncBootstrap()
                    let newCursor = result.cursor ?? 0
                    saveCursor(newCursor)
                    cursor = newCursor
                    needsBootstrap = false
                } catch {
                    lastError = (error as? APIError)?.message ?? error.localizedDescription
                    status = .error
                    return
                }
            }
```

- `result.data` is never read.
- Changes apply is explicitly stubbed (L92–94: “pilot: we only persist cursor; full apply is optional”).
- Persisted store fields (`AppStateStore`) include `lastSyncCursor` but **no** local tasks/reports snapshot to replace (`ios/.../Persistence/AppStateStore.swift`).

DTO decodes `data` but product code never consumes it (`ios/Shared/.../Endpoints.swift` `SyncBootstrapResponse`).

### Android Worker `WorkerViewModel.runSync` — cursor only

```186:191:android/AiStroykaWorker/src/main/java/ai/aistroyka/worker/WorkerViewModel.kt
                    if (needsBootstrap) {
                        val bootstrap = WorkerApi.syncBootstrap()
                        cursor = bootstrap.cursor ?: 0
                        saveCursor(cursor)
                        needsBootstrap = false
                    }
```

- `bootstrap.data` unused.
- No local entity REPLACE from bootstrap.

### Where UI tasks/reports actually come from

| Surface | Source | Notes |
|---|---|---|
| iOS today tasks | `GET /api/v1/worker/tasks/today` via `HomeView.loadTodayTasks` | Independent of sync bootstrap |
| iOS feedback | `GET /api/v1/worker/sync` via `loadFeedbackReports` | Independent of sync bootstrap |
| Android tasks | `WorkerApi.tasksToday` via `loadTasksForSelection` | Independent of sync bootstrap |
| Android feedback | `WorkerApi.workerSync` via `refreshFeedbackReports` | Independent of sync bootstrap |

**Answer to Q2:** No — mobile clients do **not** REPLACE local tasks/reports with the bootstrap snapshot (empty or otherwise).

---

## 3) Concrete trigger scenario (server real; wipe unrealized)

**Plausible server trigger:**

1. Device has non-zero cursor / hits retention or conflict → API returns **409** `must_bootstrap` (see `docs/runbooks/MOBILE_SYNC.md`).
2. Client calls `GET /api/v1/sync/bootstrap`.
3. Transient DB/PostgREST error on `worker_reports` and/or `upload_sessions` and/or `worker_tasks` → helpers return `[]`.
4. `getMaxCursor` still reads tip from `change_log` → high `cursor`.
5. Client persists tip cursor and continues changes/ack → status “synced”.

**What does *not* happen on shipped clients:** local task/report cache wipe via bootstrap apply (no such cache/apply).

**Related real bug (separate):** on `main`, 409 handler saves `serverCursor` *before* bootstrap succeeds (`SyncService.swift` L101–105; `WorkerViewModel.kt` L208–211). Failed bootstrap can leave tip cursor and skip bootstrap on next cold sync. **Fixed in open PR #199**, not this empty-snapshot issue.

---

## 4) Existing fix on `critical-bug-investigation-*`?

Scanned remote branches matching `origin/cursor/critical-bug-investigation-*`.

| Branch / PR | Touches bootstrap empty-on-error? |
|---|---|
| **#199** `cursor/critical-bug-investigation-2938` | **No** for `/sync/bootstrap`. Fixes (a) `worker/sync` feedback top-50 + **503 on report/session query errors**, (b) client cursor reset to `0` until bootstrap succeeds |
| Other investigation branches | No diffs to `sync.service.ts` / bootstrap `listForBootstrap` fail-open |

**Conclusion:** empty-on-error for **`GET /api/v1/sync/bootstrap`** is **not** fixed in any open investigation PR. PR #199 is the closest pattern (fail-closed on sibling `worker/sync`).

---

## 5) Minimal high-confidence fix (optional hardening)

Clear, small server change (mirror PR #199 `worker/sync`):

1. Make `listForBootstrap` (reports + upload sessions) and task bootstrap listing **throw or return `{ error }`** instead of silent `[]`.
2. In `sync.service.bootstrap` / route: if any list query errors → **HTTP 503** (do not advance client cursor).
3. Optionally keep `listTasksForToday` catch behavior scoped so callers that need fail-closed can distinguish error vs empty (today `error: null` on catch hides failures from `worker/tasks/today` too — separate medium issue).

Client changes not required for wipe prevention (no apply path). If full offline snapshot apply is later implemented, **must** refuse to REPLACE local state when bootstrap lists are empty **and** error/degraded flag is set (or when 503).

---

## Blast radius

| Layer | Impact today |
|---|---|
| Server `/sync/bootstrap` | Can lie with empty snapshot + tip cursor under partial DB failure |
| iOS/Android Worker sync | Advances cursor; does not mutate local entities from bootstrap |
| Worker home UI | Unaffected by bootstrap emptiness; uses `worker/tasks/today` + `worker/sync` |
| Future full-apply client / runbook-compliant client | Would become **CRITICAL** data wipe |
| Spec drift | Runbook says REPLACE; code does not |

---

## Bottom line

**NOT CRITICAL** for current Aistroyka Worker clients: the hypothesized REPLACE-with-empty data-loss path is not implemented. Treat server empty-on-error as **latent protocol fail-open** worth a small fail-closed hardening (same shape as PR #199), not as an emergency data-loss critical.
