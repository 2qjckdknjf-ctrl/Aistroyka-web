# Wave 4 Step 7 — Manager UI (Stage D)

## `StakeholderManagerPanel`

- Location: project detail, next to client portal / client requests panels (same `can_manage_client_portal` gate).
- Actions: invite by email + role (viewer vs decision-maker), list rows, revoke.
- After invite: shows **copyable URL** `origin + /dashboard/stakeholder-invite?token=…` (no outbound email in this step).

## Limitations

- No resend / expiry UI beyond listing `expires_at`.
- No in-app email send.
