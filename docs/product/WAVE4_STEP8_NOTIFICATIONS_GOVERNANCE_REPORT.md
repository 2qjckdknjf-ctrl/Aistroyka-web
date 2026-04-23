# Wave 4 Step 8 — Governance report (Stage C)

## Why a notification exists

Each row stores `kind` and `payload` sufficient for UI copy:

- **stakeholder_invite_sent / reminder:** invite path implied via `stakeholder_invite_id`; email is the primary channel.
- **client_request_new / reminder:** `client_request_id` + title/instructions in `payload`.
- **Manager inbox** (separate table): human-readable `title`/`body` for respond/accept events.

## Who it is for

- Stakeholder rows: `recipient_user_id` + `recipient_email` (email always stored for audit).
- Manager rows: `manager_notifications.user_id` per project manager/owner fallback.

## Expected action

- Stakeholders: open portal, respond to requests, accept invite (no marketing CTA).
- Managers: read inbox + delivery log; optionally resend invite.

## Reminder rules (simple)

Implemented in `stakeholder-notifications.reminders.ts`, invoked from `cron-tick`:

- **Cooldown:** `STAKEHOLDER_REMINDER_COOLDOWN_DAYS` = 7 (rolling window for duplicate suppression).
- **Invites:** status `invited`, not expired, `created_at` before the cooldown cutoff, no `stakeholder_invite_reminder` in the window.
- **Requests:** status `open`, `action_mode` ≠ `info_only`, `requested_at` before cutoff, no `client_request_reminder` in the window.

## Auditability

- Immutable sequence of rows in `stakeholder_notifications` for each send attempt.
- Manager `stakeholder-delivery` API exposes recent rows for the project.
- Cron response includes `stakeholder_reminders` counts (best-effort; failures do not fail the whole tick).
