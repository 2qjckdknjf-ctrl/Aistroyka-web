# Wave 4 Step 8 — Notifications inventory (Stage A)

## A1 — Existing architecture (relevant)

- **Stakeholders:** `project_stakeholders` invites, accept flow, portal access (`stakeholders.service`, `/api/v1/stakeholder-invites/accept`).
- **Client requests:** `project_client_requests`, create/respond, policies in `client-requests.policy`.
- **Manager inbox:** `manager_notifications` + `notifyProjectManagers` (internal tenant readers only for RLS).
- **Stakeholder delivery:** `stakeholder_notifications` table (migration `20260329170000_stakeholder_notifications.sql`), repository + Resend-backed email in `stakeholder-notifications.emit.ts`.

## A2 — Minimal high-value triggers (chosen)

| Trigger | Rationale |
|--------|-----------|
| Stakeholder invite created | Closes gap: invite was manual copy-only. |
| Client request created | Notifies active stakeholders with `user_id` (in-app row + email). |
| Invite reminder (cron) | Pending invite older than cooldown, at most one reminder per rolling window. |
| Client request reminder (cron) | Open, action-required request older than cooldown, same idempotency. |
| Stakeholder responded | Manager `manager_notifications` (existing product inbox). |
| Invite accepted | Manager inbox entry for operational awareness. |

**Deferred (explicit):** SMS/WhatsApp/Telegram; threaded messaging; campaign sequencing; SLA engine; push notifications; separate notification microservice.

## A3 — Scope for this step

Only the rows above — no new messaging product, no CRM, no billing.

## A4 — Channels

- **In-app:** `stakeholder_notifications` rows for recipients with `recipient_user_id` (post-accept stakeholders for request-related kinds).
- **Email:** Resend when `RESEND_API_KEY` and sender env are configured (`stakeholder-notifications.delivery.ts`); otherwise rows still created and status reflects email outcome.

## A5 — Intentionally deferred

- Third-party messaging channels.
- Rich HTML templates (plain text only in this step).
- Per-tenant notification preferences UI.
