# Customer iOS — estimate approve/reject (2026-10-05)

## Scope

Approve/reject sent customer estimates via:

`POST /api/v1/projects/:id/estimates/:estimateId/respond`

## Gates

- `capabilities.can_respond_to_requests`
- estimate `status == sent`
- No contractor finance fields

## Evidence

- Shared unit gate tests
- UI ids: `pilot_customer_estimate_approve_<id>` / `pilot_customer_estimate_reject_<id>`
