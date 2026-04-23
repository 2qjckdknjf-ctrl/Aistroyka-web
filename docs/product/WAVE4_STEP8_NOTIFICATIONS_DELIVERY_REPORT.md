# Wave 4 Step 8 — Delivery report (Stage F)

## Real delivery paths

1. **In-app (always for eligible rows):** Insert into `stakeholder_notifications` with status progression; stakeholders list via API with unread counts.
2. **Email (when configured):** `sendTransactionalEmailIfConfigured` in `stakeholder-notifications.delivery.ts` (Resend HTTP).

## Configuration

- Requires Resend (or compatible) env as documented in `docs/ENVIRONMENT-VARIABLES.md` and the delivery helper’s expectations.
- If email is not configured, attempts are still recorded with `email_failed` / appropriate status.

## Resend / reminder

- **Manager resend:** `PATCH .../stakeholders/:id` with `action: "resend_invite"`.
- **Automated reminders:** `runStakeholderNotificationReminders` from `cron-tick` (no separate scheduler product).

## Limitations

- No SMS/WhatsApp; no attachment handling in templates.
- Plain text email only in this step.
