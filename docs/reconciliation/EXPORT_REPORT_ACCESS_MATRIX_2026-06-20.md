# Export / Report Access Matrix — 2026-06-20

## Access Rules

| Route | Method | Actor/role | Allowed? | Tenant membership required? | Project membership required? | Stakeholder project access required? | Customer/owner access required? | Finance fields allowed? | Report fields allowed? | Media fields allowed? | PII allowed? | Requires service role? | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/api/v1/reports/export` | GET | tenant owner/admin | YES | YES | Optional `project_id` must be tenant-owned | NO | NO | Manager-only safe fields only; no internal cost/margin | YES safe subset | Metadata only unless explicitly needed | NO | NO | First implementation should target admin/manager only |
| `/api/v1/reports/export` | GET | project manager | YES | YES | YES when `project_id` provided | NO | NO | Manager-only safe fields only; no internal cost/margin | YES safe subset | Metadata only | NO | NO | Scope to managed tenant/project |
| `/api/v1/reports/export` | GET | worker | NO | YES | YES | NO | NO | NO | Own report read is allowed elsewhere, but export is not | NO | NO | NO | Worker export is out of scope |
| `/api/v1/reports/export` | GET | owner/customer | NO for first slice | YES/portal identity | YES | YES if portal | YES | Customer-safe only if later added | Possibly commercial-facing only | Possibly proof media only later | NO | NO | Defer customer exports |
| `/api/v1/reports/export` | GET | stakeholder | NO for first slice | YES/portal identity | YES | YES | NO | Stakeholder-safe only if later added | Possibly stakeholder-safe summary only later | Possibly proof metadata only later | NO | NO | Defer stakeholder exports |
| `/api/v1/reports/export` | GET | anonymous | NO | n/a | n/a | n/a | n/a | NO | NO | NO | NO | NO | Anonymous must never access exports |
| `/api/v1/reports/export` | GET | service role/internal | INTERNAL ONLY | n/a | n/a | n/a | n/a | Must still filter response | Must still filter response | Must still filter response | NO unless operationally required | YES only for internal jobs | Service role must not bypass response filtering |
| `/api/v1/projects/export` | GET | tenant owner/admin | MAYBE LATER | YES | Tenant project ownership | NO | NO | Manager/admin safe only | n/a | n/a | NO | NO | Defer until project export fields reviewed |
| `/api/v1/projects/export` | GET | project manager | MAYBE LATER | YES | YES | NO | NO | Manager/admin safe only | n/a | n/a | NO | NO | Defer |
| `/api/v1/projects/export` | GET | worker | NO | YES | YES | NO | NO | NO | n/a | n/a | NO | NO | Worker must not access finance/project exports |
| `/api/v1/projects/export` | GET | owner/customer | NO for first slice | YES/portal identity | YES | YES if portal | YES | Customer-safe only | n/a | n/a | NO | NO | Defer |
| `/api/v1/projects/export` | GET | stakeholder | NO for first slice | YES/portal identity | YES | YES | NO | Stakeholder-safe only | n/a | n/a | NO | NO | Defer |
| `/api/v1/projects/export` | GET | anonymous | NO | n/a | n/a | n/a | n/a | NO | NO | NO | NO | NO | Anonymous must never access exports |
| `/api/v1/reports/[id]` review | PATCH | tenant owner/admin/project manager | YES | YES | Report/project must be tenant-scoped | NO | NO | n/a | Writes review fields | n/a | NO | NO | Existing behavior; side effects require tests before expansion |
| `/api/v1/reports/[id]` review | PATCH | worker | NO | YES | own report only for read | NO | NO | n/a | NO review writes | n/a | NO | NO | Worker cannot approve/reject |
| `/api/v1/reports/[id]` review | PATCH | stakeholder/customer/anonymous | NO | n/a | n/a | n/a | n/a | NO | NO | NO | NO | NO | Never review reports |

## Explicit Rules
- Anonymous must never access exports.
- Worker must not access finance exports.
- Stakeholder must only see stakeholder-safe project data if a later stakeholder export is designed.
- Customer/owner must only see own project scope and commercial-facing fields.
- Manager/admin access must still be tenant/project scoped.
- Service role must not bypass response filtering.
