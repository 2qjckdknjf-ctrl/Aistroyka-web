# Wave 4 Step 8 — Integration report (Stage G)

## Integrated flows

| Flow | Integration |
|------|-------------|
| Invite created | `POST /stakeholders` → `emitStakeholderInviteSent` |
| Invite resent | `PATCH /stakeholders/:id` `resend_invite` → same emit |
| Client request created | `POST /client-requests` → `emitClientRequestCreatedForStakeholders` |
| Stakeholder responded | `POST .../respond` → `notifyProjectManagers` (admin) |
| Invite accepted | `POST /stakeholder-invites/accept` → `notifyProjectManagers` (admin) |
| Reminders | `POST /admin/jobs/cron-tick` → `runStakeholderNotificationReminders` |

## Manager visibility

- `manager_notifications` inbox for respond/accept.
- `stakeholder-delivery` API + `StakeholderManagerPanel` log for stakeholder-specific delivery rows.

## Stakeholder visibility

- `stakeholder-notifications` GET + mark-read POST + `ClientPortalNotificationsSection`.

## Not touched (intentional)

- Billing, Android apps, marketing, chat, cross-product campaigns.
- Broad dashboard redesign.
