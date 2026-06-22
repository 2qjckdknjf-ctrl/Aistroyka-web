# Export Security and Role-Gate Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Allowed Behavior

Allowed:

- tenant owner
- tenant admin
- authenticated, non-lite client
- valid tenant context
- optional `project_id` only after project access validation

## Denied / Hidden Behavior

Denied or hidden:

- anonymous
- worker/lite clients
- tenant member without owner/admin export role
- tenant viewer
- tenant stakeholder
- customer/owner portal-style stakeholder
- project worker
- manager/non-owner for export UI

Backend remains the authority. UI visibility is not treated as authorization.

## CSV Safe Fields

Current CSV columns:

- `report_id`
- `project_id`
- `worker_user_id`
- `status`
- `created_at`
- `submitted_at`
- `reviewed_at`
- `media_count`
- `analysis_status`

## Forbidden Fields

Must remain absent:

- internal cost/budget/margin/profitability/budget pressure
- contractor/subcontractor cost
- internal finance or AI finance risk
- manager note
- worker note
- comments/free text
- media URLs or signed URLs
- email/phone/customer/stakeholder data
- tenant-wide customer/stakeholder export data

## Report Review Auth Fix Relation

PR #109 also fixed `PATCH /api/v1/reports/:id` authorization. That fix is related because Manager report review must not rely on spoofable client profile. Export remains separate and stricter: only owner/admin can export.

## Regression Risks

Future polish must not:

- broaden export visibility to project managers without new policy review
- add status/date filters to UI without tests
- add tenant-wide export UI
- add project export CSV
- add free text notes or media URLs
- move export button to top-level Reports without role context plumbing
- change CSV schema

## Security Verdict

Export security currently acceptable: YES, for PR #109 scope.

Security is acceptable because backend route and UI helper tests enforce owner/admin-only export and safe CSV columns, and PR #109 runtime evidence validates owner/admin positive path plus non-owner denial.
