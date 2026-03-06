# Phase 7.7 — Pilot Launch Hardening

**Date:** 2026-03-06  
**Scope:** Push correctness, migration ordering, iOS task↔report linkage correctness, compliance gates, E2E smoke.

---

## What changed

### 1. Migration timestamps (P0)

- Phase 7.6/7.7 migrations renamed to current date (2026-03-06); order preserved. See **REPORT-PHASE7-7-1-MIGRATION-FIX.md** for final names:
  - **`20260306130000_reports_task_id.sql`**, **`20260306140000_worker_tasks_extend.sql`**, **`20260306150000_push_outbox_device_id.sql`**.
- SQL unchanged; rename only.

### 2. Push dedupe per device (P0)

- **Dedupe key** is now per device: `(tenant_id, user_id, device_id, type, payload.task_id)`.
- **Enqueue:** `enqueuePushToUser` loads devices from `device_tokens` and inserts **one outbox row per device** with `device_id` set; before insert, skips a device if a queued row already exists for that (user, device, type, task_id).
- **Send:** When `row.device_id` is set, push-send fetches only that device’s token and sends to one device; when null, legacy behavior (all tokens for user+platform).
- **Result:** A user with 2 devices gets 2 notifications on assign; repeat assign does not create duplicate rows per device.
- **Tests:** `push.service.test.ts`: two devices ⇒ two enqueued rows; repeat assign ⇒ 0 new rows (dedupe).

### 3. iOS task_id correctness (P0)

- **Report create:** `ReportCreateView` uses `taskIdForCreate = taskId ?? store.state.draftTaskId` so the **server task UUID** (from navigation `taskId`) is sent as `task_id` to report/create when the report is started from a task.
- **Report submit:** Submit payload now includes `taskIdForSubmit = taskId ?? store.state.draftTaskId`; `WorkerAPI.submitReport` sends optional `task_id` in the body; executor passes `op.payload.taskId` to the API.
- **Local only:** `draftTaskId` remains for UI state; backend always receives server `task_id` when flow started from task.
- **Test:** `WorkerLiteTests`: `testCreateReportPayload_IncludesTaskIdWhenSet` — createReport payload with server task UUID is preserved in queue and for API.

### 4. P0 RBAC / tenant tests

- **report.service.task-link.test.ts:**
  - Cross-tenant: `createReport` with `task_id` not in tenant → `task_invalid` (getById returns null); insert not called.
  - Not assigned: `createReport` / `submitReport` with `task_id` not assigned to user → `task_not_assigned` (403); insert/submit not called.
- API mapping unchanged: `task_invalid` → 404, `task_not_assigned` → 403.

### 5. E2E smoke

- **pilot-task-report-smoke.spec.ts:** Navigate to `/dashboard/tasks`; if authenticated, open first task detail; expect “Linked report” section visible (— or View report). No insecure bypass.
- CI runs both `cockpit-smoke.spec.ts` and `pilot-task-report-smoke.spec.ts`.

---

## Verification checklist

1. **Gates**
   - `cd apps/web && bun run test -- --run && bun run cf:build` — passes.

2. **Create + assign → two devices get push**
   - Manager creates task, assigns to a worker who has 2 registered devices.
   - Confirm two outbox rows (one per device) and two deliveries (or two FCM targets).
   - Re-assign same task to same worker → no new outbox rows for that task/type.

3. **Worker starts report from task → report shows task link**
   - In WorkerLite, open a task and start report; create then submit.
   - Confirm report/create and report/submit requests send `task_id` (server UUID).
   - In web, open report list/detail or task detail; confirm task↔report linkage.

4. **Ops overview / metrics**
   - Dashboard and ops overview show task KPIs (e.g. tasks assigned today, open, overdue) and deep links to `/dashboard/tasks?...`.

5. **E2E**
   - Run: `cd apps/web && npm run test:e2e -- tests/e2e/cockpit-smoke.spec.ts tests/e2e/pilot-task-report-smoke.spec.ts`.
   - Without auth, pilot smoke passes (redirect). With auth and at least one task, task detail shows “Linked report” section.

---

## Rollout order

1. **Backend:** Deploy web (migrations: `20260306130000`, `20260306140000`, `20260306150000`). Run migrations before or with deploy.
2. **Web:** Same deploy; no separate step.
3. **iOS:** Ship WorkerLite build that sends `task_id` on report create/submit (and uses navigation `taskId` for create).

---

## Rollback notes

- **Migrations:** Rolling back app without reverting migrations is safe (new columns nullable / additive). To revert migrations, add down-migrations that drop `worker_reports.task_id`, revert `worker_tasks` columns, and drop `push_outbox.device_id` if desired.
- **Push:** If reverting push dedupe, redeploy previous worker; outbox rows with `device_id` set can be ignored by old send handler (single-device send may fall back to “all tokens” if handler doesn’t read `device_id`).
- **iOS:** Old app sending only `draftTaskId` or no `task_id`: backend accepts optional `task_id`; reports without `task_id` remain valid; linkage is additive.
- **API:** No v1 contract changes; all changes additive.

---

## Definition of done (Phase 7.7)

- [x] DB migrations correctly timestamped (no future ordering).
- [x] Push outbox dedupe per device (multi-device delivery works).
- [x] WorkerLite sends `task_id` (not draftTaskId) to report/create and report/submit.
- [x] P0 tests for cross-tenant and not-assigned task linking.
- [x] Playwright smoke: task list → task detail → “Linked report” section visible.
- [x] Final pilot launch report and checklist (this document).
