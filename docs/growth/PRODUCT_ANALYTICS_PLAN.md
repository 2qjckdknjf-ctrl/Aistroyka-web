# Product Analytics Plan

**Phase 8 — Pilot Rollout & Growth**  
**Minimal, privacy-safe product analytics for pilot and growth.**

Phase 8 reports still describe this plan as not implemented. Two events are stored on `main` as of 2026-09-28. The funnel names below stay the plan; query `audit_logs.action`, not the plan names.

---

## Stored today

Writer: `apps/web/lib/growth/product-events.ts`. Rows go to `public.audit_logs` through `emitAudit` (login) or a direct insert (`notification_opened`). Writes are best-effort, capped at 2 seconds, and never fail the user action. Payloads are categorical: no email, name, title, or body. Unknown tokens (including anything with `@`, or longer than the allow-list) are dropped.

There is no public activation rate. `activationBaseline()` is an in-process helper used by tests. `GET /api/v1/activation/status` returns the onboarding checklist and may record the first login as a side effect. It does not return a percentage.

| Plan name | Stored `action` | When a row is written |
|-----------|-----------------|------------------------|
| `login_success` | `login` | First workspace login only. See below. |
| `notification_opened` | `notification_opened` | User opens an owned inbox row's target. See below. |
| `task_assigned` | `task_assignment` | Existing compliance audit on task assign (`resource_type=task`). Counted by the helper. |
| `report_submitted` | `report_submit` | Existing compliance audit on report submit (`resource_type=report`). Counted by the helper. |
| `report_reviewed` | `report_review` | Existing compliance audit on review (`details.status`, `details.has_note` only). Counted by the helper. |
| `task_created` | — | Not emitted as a product event. |
| `ai_analysis_used` | — | AI routes emit their own `ai_*` audit actions. That is not this event. |

`login` details: `client`, `role`. `resource_type` is `session`.
`notification_opened` details: `client`, `role`, `notification_type`, `destination_kind`, `target_type` (same value as `destination_kind`), `source` (`inbox`). `resource_type` is `notification`. `resource_id` is the inbox row id.

Allowed `client` values: `web`, `ios_full`, `ios_lite`, `ios_worker`, `ios_manager`, `android_full`, `android_lite`, `android_worker`, `android_manager`. Allowed `role` values: `owner`, `admin`, `member`, `viewer`, `stakeholder`. `notification_type` and destination must match `^[a-z0-9_]{1,40}$`.

### First login (`action = login`)

Call sites:

- `POST /api/auth/login` after a successful password sign-in.
- `GET /api/auth/callback` after a normal OAuth session. Skipped when `intent=link`. Skipped when `recovery=1` (that branch returns before any login write).
- `GET /api/v1/activation/status` when the caller already has a tenant. iOS Worker and Manager request this from the home screen, so a mobile session can record the first login without the web password route.

The workspace is the user's own tenant (`role=owner`) or their primary membership. No membership means no row. `viewer` and `stakeholder` are not written.

Dedup needs the service-role client. Callers pass `getAdminClient()`. If that client already sees a `login` row for the same tenant and user, the write is skipped. There is no unique index on `login`. If the service-role client is absent, the dedup read is skipped and the user-scoped client attempts the insert, so a later sign-in can add another row. Do not treat `login` as every session.

A missing `x-client` on the password and callback paths is stored as `web`. A header that is not in the allow-list is omitted. The activation route uses the same header.

### Inbox open (`action = notification_opened`)

`POST /api/v1/notifications/:id/opened` with the caller's session.

- **200** `{ "ok": true }` when the row belongs to the caller in the current tenant. Telemetry failure still returns 200.
- **404** when the id is missing or not owned. Nothing is written.
- **401 / 403** when tenant context is missing or forbidden.

The handler does not set `read_at`. Mark-read and mark-all-read do not write this action. List and unread-count fetches do not write it. Push taps that only carry a task id do not write it. Android has no caller.

The server records an owned notification when the id is a UUID. `notification_type` and `target_type` are stored only when they match the slug pattern; the row is still inserted when they do not. Clients decide when to call:

| Client | Calls when |
|--------|------------|
| Web inbox | `target_type` is `task`, `report`, or `project` and `target_id` is set; or `document` / `issue` and both `target_id` and `project_id` are set. A generic dashboard fallback does not call. |
| iOS Manager inbox | `target_type` is `task`, `report`, `project`, `document`, or `issue`, with a target id. `issue` also needs `project_id`. `x-client` is `ios_manager`. |
| iOS Worker inbox | `report`, `issue`, `task`, or `document` with a target id. A project-only row is mark-read only. `x-client` is `ios_worker`. |
| Android | No open call. |

Worker lite headers (`ios_lite`, `android_lite`, `ios_worker`, `android_worker`) are allow-listed for this POST. One row per tenant, user, and notification id. The repo migration `apps/web/supabase/migrations/20260927230000_notification_opened_once.sql` adds that partial unique index. A duplicate insert (`23505`) is ignored. Applying the migration to project AISTROYKA is a separate operator step; this page does not claim the live index is present.

### Activation helper

`activationBaseline(rows)` counts users, not sessions:

- Earliest `login` row per `user_id`. Rows with `role` `viewer` or `stakeholder` are ignored. The database stores that role in `details.role`, not a column. Copy `details.role` onto `role` before calling the helper, or the exclusion does not run.
- A user is activated when `task_assignment`, `report_submit`, or `report_review` falls at or after that first login and within 7 days.
- `rate` is `activatedUsers / loginUsers`, or `null` when there are no usable logins. An empty sample is not zero.

Example first-login row:

```json
{
  "action": "login",
  "resource_type": "session",
  "user_id": "uuid-user",
  "tenant_id": "uuid-tenant",
  "details": { "client": "ios_worker", "role": "member" }
}
```

Example inbox open:

```json
{
  "action": "notification_opened",
  "resource_type": "notification",
  "resource_id": "uuid-notification",
  "details": {
    "client": "web",
    "role": "admin",
    "notification_type": "task_assigned",
    "destination_kind": "task",
    "target_type": "task",
    "source": "inbox"
  }
}
```

---

## Planned events

The table below is the original plan. Use the stored-action column above when reading `audit_logs`. `user_id` on stored rows is the auth UUID, not a hash.

### Tracked events

| Event | When | Attribution |
|-------|------|-------------|
| **login_success** | User successfully signs in (web or app). | tenant_id, user_id (hashed or internal id), client (web / ios_worker / ios_manager). |
| **task_created** | A task is created (e.g. by manager or system). | tenant_id, user_id, project_id (optional). |
| **task_assigned** | A task is assigned to a worker. | tenant_id, user_id (assigner), project_id, task_id. |
| **report_submitted** | A report is submitted by a worker. | tenant_id, user_id, project_id, report_id, has_media (boolean). |
| **report_reviewed** | A manager performs a review action (approve / request changes / etc.). | tenant_id, user_id, report_id, review_action. |
| **ai_analysis_used** | User triggers or completes an AI analysis (e.g. image analysis, summary). | tenant_id, user_id, project_id (optional), analysis_type. |
| **notification_opened** | User opens a notification (push or in-app). | tenant_id, user_id, notification_type, target_type (task / report / project). |

**No PII in event payloads:** No email, name, or free text in events. Use tenant_id, user_id (internal UUID), and categorical fields only.

---

## Event schema (minimal)

Planned shape for a future sink. Stored rows use `audit_logs` columns (`action`, `resource_type`, `resource_id`, `details`, `created_at`), not this envelope.

Each planned event is a JSON object with:

- **event** (string): One of the event names above.
- **ts** (string): ISO 8601 timestamp (UTC).
- **tenant_id** (string): Tenant UUID.
- **user_id** (string): User UUID (internal; not email).
- **client** (string, optional): `web` | `ios_worker` | `ios_manager` | `android_worker`.
- **context** (object, optional): Event-specific fields (e.g. project_id, task_id, report_id, has_media, review_action, notification_type). No free text.

**Example:**

```json
{
  "event": "report_submitted",
  "ts": "2026-03-10T12:00:00Z",
  "tenant_id": "uuid-tenant",
  "user_id": "uuid-user",
  "client": "ios_worker",
  "context": { "project_id": "uuid-project", "report_id": "uuid-report", "has_media": true }
}
```

---

## Tenant / user attribution

- **tenant_id:** From session or request context; required for all events in multi-tenant app.
- **user_id:** Authenticated user’s internal ID; required. Do not send email or name.
- **client:** From app or request header (e.g. x-client) to distinguish web vs iOS Worker vs iOS Manager.
- **Optional:** device_id or session_id for deduplication or session-based metrics; keep as opaque ID, not PII.

---

## Privacy-safe logging

- **No PII:** No email, name, phone, or address in event payloads.
- **No content:** No report body, task title text, or comment text in events; only IDs and categorical flags.
- **Retention:** Define retention (e.g. 90 days for raw events) and document in data retention policy.
- **Access:** Only authorized roles (e.g. org admin, product) can access analytics; tenant-scoped where possible.
- **Legal:** Align with PRIVACY-PII-POLICY and any regional requirements (e.g. GDPR); document in privacy notice if needed.

---

## Funnel definitions

| Funnel | Steps | Use |
|--------|--------|-----|
| **Activation** | login_success → (task_assigned OR report_submitted) | % of logins that lead to core action within 7 days. |
| **Manager activation** | login_success (manager) → task_assigned → report_reviewed | Manager has assigned and reviewed. |
| **Worker activation** | login_success (worker) → report_submitted | Worker has submitted at least one report. |
| **Full loop** | task_assigned → report_submitted → report_reviewed | One complete assign → submit → review cycle. |

The helper implements a narrower activation check: one earliest `login` per user, then `task_assignment`, `report_submit`, or `report_review` inside 7 days. It does not split manager and worker funnels, and it is not exposed on an API.

---

## Retention definitions

- **Weekly active manager (WAM):** Distinct user_id with role manager (or admin) and at least one event (login_success, task_assigned, report_reviewed, ai_analysis_used) in the calendar week.
- **Weekly active worker (WAW):** Distinct user_id with role worker and at least one event (login_success, report_submitted) in the calendar week.
- **Retention (Day 7):** % of users who had login_success in Week 0 and have any event in Week 1.
- **Retention (Week 4):** % of users who had login_success in Week 0 and have any event in Week 4.

---

## Time-to-first-value

- **Manager:** Time from first login_success to first task_assigned (or first report_reviewed). Target: < 24–48 hours with onboarding.
- **Worker:** Time from first login_success to first report_submitted. Target: < 24–48 hours with onboarding.
- **Full loop:** Time from first task_assigned to first report_reviewed for that task. Metric for “review turnaround time” (see GROWTH_KPI_FRAMEWORK).

---

## Implementation notes

- **Stored:** `login` and `notification_opened` are written to `audit_logs` as described in [Stored today](#stored-today). There is no `product_events` table and no public rate.
- **Still plan-only:** `task_created` and `ai_analysis_used` are not emitted under those names. WAM, WAW, and week-4 retention are definitions only.
- **Privacy:** Keep new fields categorical. Do not add email, titles, or free text to `details`.
