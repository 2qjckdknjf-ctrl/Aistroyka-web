# Wave 4 Step 8 — Notifications summary

One-line goal: **controlled, auditable stakeholder-notification delivery** on top of portal + requests + identity (not chat, not campaigns).

## Delivered

- **Model:** `stakeholder_notifications` + manager inbox hooks for respond/accept.
- **Triggers:** Invite sent/resend, client request created, cron reminders (invite + open request), manager notifications on respond and invite accepted.
- **Channels:** In-app (API + UI) + email (Resend when configured).
- **Manager:** Delivery log + resend invite on `StakeholderManagerPanel`.
- **Stakeholder:** Portal “Updates for you” with unread + mark read.
- **Cron:** `stakeholder_reminders` counts on `cron-tick` response.

## Honest gaps

- Email delivery requires env setup; DB migration must be applied per environment.
- No SMS/third-party messaging.

## Docs index

1. `WAVE4_STEP8_NOTIFICATIONS_INVENTORY.md`
2. `WAVE4_STEP8_NOTIFICATIONS_BACKEND_REPORT.md`
3. `WAVE4_STEP8_NOTIFICATIONS_GOVERNANCE_REPORT.md`
4. `WAVE4_STEP8_NOTIFICATIONS_MANAGER_UI_REPORT.md`
5. `WAVE4_STEP8_NOTIFICATIONS_CLIENT_UI_REPORT.md`
6. `WAVE4_STEP8_NOTIFICATIONS_DELIVERY_REPORT.md`
7. `WAVE4_STEP8_NOTIFICATIONS_INTEGRATION_REPORT.md`
8. `WAVE4_STEP8_NOTIFICATIONS_VALIDATION_REPORT.md`
9. `WAVE4_STEP8_NOTIFICATIONS_POST_AUDIT.md`
10. `WAVE4_STEP8_NOTIFICATIONS_SUMMARY.md` (this file)
