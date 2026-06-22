# Reports Export UI Role Matrix — 2026-06-20

| Role | Can see export UI? | Can call export route? | `project_id` required? | Tenant-wide export allowed? | Reason |
|---|---|---|---|---|---|
| Tenant owner | YES | YES | YES for selected UI | Backend allows tenant-wide, but UI should start project-scoped | safest visible slice |
| Tenant admin | YES | YES | YES for selected UI | Backend allows tenant-wide, but UI should start project-scoped | safest visible slice |
| Project manager | NO for initial UI | NO with current backend unless owner/admin | n/a | NO | backend route is owner/admin-only |
| Worker | NO | NO | n/a | NO | worker blocked |
| Owner/customer | NO | NO | n/a | NO | no customer export |
| Stakeholder | NO | NO | n/a | NO | no stakeholder export |
| Anonymous | NO | NO | n/a | NO | auth required |

## Decision
- Initial UI must be visible only when the frontend can confidently identify tenant owner/admin.
- If owner/admin role is not available in the selected component, first implementation should add a pure URL helper and keep the visible button behind existing role context only.
- Do not broaden backend route or UI roles.
