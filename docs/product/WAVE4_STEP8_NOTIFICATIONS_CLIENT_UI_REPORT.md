# Wave 4 Step 8 — Stakeholder / client UI report (Stage E)

## Surfaces

**Component:** `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/client/ClientPortalNotificationsSection.tsx`

- Rendered from `ClientPortalViewClient` above the requests section.
- Loads `GET /api/v1/projects/:id/stakeholder-notifications`.
- Shows unread badge + list with title/body from `rowToPublic` (non-technical copy).
- **Mark as read** → `POST .../stakeholder-notifications/:id/read`.

## Who sees it

Anyone with `canStakeholderAccessClientRequests` (project owner legacy path + active external stakeholders). Rows only exist for `recipient_user_id` (typically after accept for request-related notifications).

## Action-needed flow

- Requests remain in `ClientPortalRequestsSection`; notifications are additive “updates” for the same cohort.

## Limitations

- Pending invitees (not yet authenticated) do not see in-app rows until they have a user id; they rely on email for the invite.
