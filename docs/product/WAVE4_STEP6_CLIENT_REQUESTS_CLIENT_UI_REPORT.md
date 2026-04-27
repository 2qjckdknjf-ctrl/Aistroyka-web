# Wave 4 Step 6 — Client / stakeholder UI (Stage E)

## Location

- `ClientPortalRequestsSection` on `/dashboard/projects/[id]/client`, fed from `client_requests` on `ClientProjectView` (and refreshed after respond).

## UX

- Section title clarifies this is **not chat** — explicit tracked requests.
- Per-request: title, kind, instructions, link hint, status badge.
- **Respond** expands controls by kind:
  - Approve / Reject buttons
  - Feedback textarea + submit
  - Acknowledge button
  - Choice radios + submit
  - Document review confirm
- Optional note field shared in expanded form.
- After submission, query invalidation reloads portal data.

## Limitations

- Copy is English-only in components (consistent with adjacent client portal strings).
- No separate “request detail” route; inline expansion only.
