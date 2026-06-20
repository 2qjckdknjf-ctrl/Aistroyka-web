# Dashboard Role-Safe Nav Matrix — 2026-06-20

| Nav candidate | Owner/admin | Manager | Worker | Owner/customer | Stakeholder | Anonymous | Notes |
|---|---|---|---|---|---|---|---|
| Dashboard | YES | YES | YES/PARTIAL | NO internal | NO internal | NO | Authenticated workspace only. |
| Projects | YES | YES | YES/PARTIAL | NO internal | NO internal | NO | Existing. |
| Reports | YES | YES | YES read own via route constraints | NO internal | NO internal | NO | Existing. |
| Reports export UI | YES | NO unless admin role | NO | NO | NO | NO | Must match backend owner/admin-only guard. |
| Approvals | YES | YES | NO/PARTIAL | NO internal | NO internal | NO | Existing manager workflow. |
| Documents top-level | NO for first slice | NO for first slice | NO | NO | NO | NO | Keep project-scoped first. |
| Project documents subnav | YES | YES | maybe read-only if project role supports | customer-safe only later | stakeholder-safe only later | NO | Requires project scope. |
| Costs/budget | YES internal | YES internal | NO | NO | NO | NO | Never expose internal finance to customer/stakeholder. |
| Schedule/milestones | YES | YES | read if project-scoped | customer-safe only later | stakeholder-safe only later | NO | Project subnav candidate. |
| Owner/customer portal | NO internal nav | NO internal nav | NO | YES if role/data | NO/limited | NO | Separate portal flow. |
| Stakeholder portal | NO internal nav | NO internal nav | NO | NO | YES if role/data | NO | Separate portal flow. |
| Admin Push/Jobs | YES | NO | NO | NO | NO | NO | Existing admin group. |
| Admin System/Trust/Governance | YES later | NO | NO | NO | NO | NO | Manual review before exposing. |
| AI admin/Flywheel | NO now | NO | NO | NO | NO | NO | Blocked. |

## Hard Rules
- Customer/stakeholder must not see internal costs, budget, or finance links.
- Worker must not see manager/admin review/export controls.
- AI admin/Flywheel links remain hidden.
- Reports export UI, if later added, is owner/admin only.
- Anonymous users see no dashboard nav.
