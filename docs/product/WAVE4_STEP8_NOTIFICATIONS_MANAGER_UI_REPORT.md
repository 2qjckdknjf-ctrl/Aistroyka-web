# Wave 4 Step 8 — Manager UI report (Stage D)

## Surfaces

**Component:** `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/StakeholderManagerPanel.tsx`

### Delivery log

- Fetches `GET /api/v1/projects/:id/stakeholder-delivery`.
- Shows last ~25 rows: `kind`, recipient email, status, email delivered timestamp (if any).

### Resend invite

- **Resend invite** (`PATCH` with `action: "resend_invite"`) for rows with `status === "invited"`.
- Emits another `stakeholder_invite_sent` record (auditable) and attempts email send.

### Copy updates

- Invite form footnote now states that email is sent when outbound email is configured.

## Workflow

1. Invite → row appears in delivery log after POST returns.
2. Pending invite → manager can resend without waiting for cron.
3. Cron reminders → visible as new rows in the log (kinds `stakeholder_invite_reminder`, `client_request_reminder`).

## Limitations

- No global tenant-wide notification center in this step (project-scoped panel only).
- No per-row deep link editor (by design).
