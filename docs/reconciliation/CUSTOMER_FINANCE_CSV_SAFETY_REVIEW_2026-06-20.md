# Customer / Stakeholder Finance CSV Safety Review — 2026-06-20

## Existing Finance / Export-Relevant Fields
Current main includes domains for reports, projects, costs, estimates, commercial items, change orders, customer estimates, documents, proof packs, stakeholders, and portal views.

Known forbidden customer-facing keys from `customer-finance-guard`:
- `project_cost_items`
- `internal_cost_item_id`
- `planned_amount`
- `actual_amount`
- `margin`
- `profitability`
- `budget_pressure`
- `cost_overrun`
- `subcontractor_cost`
- `ai_finance_risk`
- any key containing `internal_cost`

## Field Classification

| Field/category | Classification | Notes |
|---|---|---|
| report id | manager_only / stakeholder_safe if scoped | Safe identifier only inside authorized project scope |
| report status | stakeholder_safe | For customer/stakeholder only if report itself is intended visible |
| report created/submitted/reviewed timestamps | stakeholder_safe | Safe as operational proof metadata |
| worker note | unknown_defer | May contain PII or internal operational detail |
| manager note | manager_only by default | Can contain internal critique; customer visibility must be designed |
| media count | stakeholder_safe | Count only, not URLs |
| media URLs | unknown_defer | Could reveal private storage paths or sensitive photos |
| project id/name/status | stakeholder_safe if assigned | Only within authorized project |
| estimate/customer estimate amount | public_to_project_owner / stakeholder_safe if intentionally shared | Commercial-facing only |
| change order price sent for approval | public_to_project_owner / stakeholder_safe if intentionally shared | Customer-facing only |
| payment schedule | public_to_project_owner if intentionally configured | Not default |
| `planned_amount` | forbidden_for_export to customers/stakeholders | Internal cost/budget |
| `actual_amount` | forbidden_for_export to customers/stakeholders | Internal cost |
| `margin` / profitability | forbidden_for_export | Internal company finance |
| `budget_pressure` / cost overrun | forbidden_for_export | Internal risk signal |
| subcontractor/labor/internal cost item | forbidden_for_export | Internal contractor finance |
| AI finance risk | forbidden_for_export | Internal AI risk |
| tenant-wide project list | manager_only/admin_only | Stakeholder/customer must never get tenant-wide data |

## Should CSV Export Exist Now?
- Customer/stakeholder finance CSV: NO.
- Manager/admin report CSV with no finance fields: YES as a possible minimal future slice.
- Project export CSV: DEFER until field list is narrowed and tests prove no internal finance leaks.

## Allowed Columns For Minimal Report CSV
For a manager/admin-only report export:
- `report_id`
- `project_id`
- `worker_user_id`
- `status`
- `created_at`
- `submitted_at`
- `reviewed_at`
- `reviewed_by`
- `media_count`
- `analysis_status`

Do not include free-text notes in the first slice.

## Mandatory Filters
- tenant ID from server-side tenant context only
- optional `project_id` must be checked against tenant/project access
- date range must be bounded
- limit/streaming behavior must avoid tenant-wide unbounded export

## Required Isolation Tests
- tenant A cannot export tenant B reports
- project A scoped export cannot include project B
- worker receives 403 for report export
- anonymous receives 401
- stakeholder/customer receives 403 for manager/admin export
- CSV does not contain forbidden keys or columns
- service-role/internal helper still filters response columns

## Verdict
- Customer finance CSV safe now: NO.
- Stakeholder export safe now: NO.
- Minimal manager/admin report CSV may be safe later after tests.
