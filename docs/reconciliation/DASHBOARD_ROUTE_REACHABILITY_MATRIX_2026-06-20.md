# Dashboard Route Reachability Matrix — 2026-06-20

| Surface | Route exists | Component exists | Nav link exists | Top-level candidate | Project-scoped candidate | Role-gated | Hidden by flag | Backend ready | Safe to expose now | Reason |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard home | YES | YES | YES | YES | NO | auth | NO | YES | YES | Current core route. |
| Projects | YES | YES | YES | YES | NO | auth | NO | YES | YES | Current core route. |
| Project detail | YES | YES | indirect | NO | YES | auth/project | NO | YES | YES | Contextual route. |
| Reports | YES | YES | YES | YES | project sublinks later | auth | NO | YES | YES | Current core route. |
| Report detail | YES | YES | indirect | NO | YES | auth/project/report | NO | YES | YES | Enter via report list. |
| Reports export UI | NO | NO | NO | NO | inside reports page later | owner/admin only | NO | YES | YES later | Backend ready; needs role-gated UI plan. |
| Documents | YES | YES | NO top-level | NO | YES | auth/project | NO | YES | YES project-scoped | Avoid top-level clutter and customer finance risk. |
| Costs/budget | YES | YES/PARTIAL | NO top-level | NO | YES internal only | manager/admin/internal | NO | YES | NO top-level | Internal finance; must not expose to customer/stakeholder. |
| Schedule/milestones/timeline | YES | YES/PARTIAL | NO top-level | NO | YES | auth/project | NO | YES | YES project-scoped | Belongs in project detail. |
| Approvals | YES | YES | YES | YES | YES | auth | NO | YES | YES | Already visible. |
| Uploads | YES | YES | YES | YES | project context too | auth | NO | YES | YES | Already visible. |
| Devices | YES | YES | YES | YES | NO | auth | NO | YES | YES | Already visible. |
| AI/Copilot | YES/PARTIAL | YES | YES | limited | project AI route | auth/env | AI env | PARTIAL | PARTIAL | Do not expand to Flywheel/Admin AI. |
| Alerts | YES | YES | YES | YES | NO | auth | NO | YES | YES | Already visible. |
| Support | YES | YES | YES | YES | NO | auth | NO | YES | YES | Already visible. |
| Settings | YES | YES | YES | YES | NO | auth | NO | YES | YES | Already visible. |
| Help | YES | YES | YES | YES | NO | auth | NO | YES | YES | Already visible. |
| Owner/customer portal | YES | YES | limited | NO | YES | owner/customer/project | NO | PARTIAL | MANUAL | Finance-safe audit needed. |
| Stakeholder portal | YES | YES/PARTIAL | limited | NO | YES | stakeholder/project | NO | PARTIAL | MANUAL | Finance-safe audit needed. |
| Admin | YES | YES | PARTIAL | YES admin group | NO | owner/admin | NO | PARTIAL | PARTIAL | Expose only stable admin entries. |
| AI admin/Flywheel | external/current partial | PARTIAL | NO | NO | NO | owner/admin | AI backend | NO | NO | Blocked by AI migrations/runtime. |
