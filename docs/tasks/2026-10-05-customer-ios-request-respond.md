# Customer iOS — portal request approve/reject (2026-10-05)

## Scope

Customer app can submit approve/reject for open `approve_or_reject` portal requests via:

`POST /api/v1/portal/projects/:id/decisions/:requestId/respond`

## Gates

- Only when `capabilities.can_respond_to_requests` is true
- Only `status=open` + `action_mode=action_required` + `kind=approve_or_reject`
- No contractor finance fields; no Manager/Worker merge

## Evidence

- Shared unit: `CustomerPortalProjectViewTests` (approve/reject gate)
- UI: `pilot_customer_request_approve_<id>` / `pilot_customer_request_reject_<id>`
