# Product Analytics Plan

**Phase 8 — Pilot Rollout & Growth**  
**Minimal, privacy-safe product analytics for pilot and growth.**

---

## Tracked events

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

Each event is a JSON object with:

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

- **Backend:** Emit events from API routes (e.g. after successful report submit, task assign, review) to a logging/analytics sink (e.g. structured log, webhook, or analytics provider). Use same tenant/user context as request; no extra PII.
- **Client:** Optional client-side events (e.g. notification_opened) if not already captured server-side; same schema and privacy rules.
- **Storage:** Events can be stored in dedicated table (e.g. product_events) or streamed to external tool; ensure tenant_id and user_id are indexed for funnel and retention queries.
- **Pilot:** Start with server-side events for login_success, task_assigned, report_submitted, report_reviewed; add task_created, ai_analysis_used, notification_opened as needed.
