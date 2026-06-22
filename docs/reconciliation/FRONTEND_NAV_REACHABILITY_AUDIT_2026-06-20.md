# Frontend Navigation / Reachability Audit — 2026-06-20

| Product surface | Route exists | Component exists | Nav link exists | Role allowed | Flag required | API dependency | Visible to user | Blocker |
|---|---|---|---|---|---|---|---|---|
| Public landing | YES | YES | YES | public | NO | low | YES | none |
| Public marketing subpages | YES | YES | YES in public header/mobile menu | public | NO | low | YES | none |
| Dashboard home | YES | YES | YES | authenticated | NO | dashboard APIs | YES after auth | auth/session |
| Projects | YES | YES | YES | authenticated | NO | `/api/v1/projects` | YES | auth/data |
| Reports list | YES | YES | YES (`/dashboard/reports`) | authenticated | NO | `/api/v1/reports` | YES | auth/data |
| Report detail | YES | YES | indirect via list | authenticated | NO | `/api/v1/reports/[id]` | PARTIAL | must enter through list/detail link |
| Report review | YES backend/UI components | indirect | manager/admin/member policy | NO | PATCH report API | PARTIAL | no separate obvious nav; role/data-dependent |
| Reports export UI | backend route YES | UI NO/UNKNOWN | NO | owner/admin backend | NO | `/api/v1/reports/export` | NO | no frontend button/wiring |
| Documents | YES under project | YES | NO top-level | project access | NO | document APIs | PARTIAL | project-context only |
| Costs/budget | YES under project | YES | NO top-level | internal manager | NO | costs APIs | PARTIAL | should stay internal; no customer nav |
| Schedule/milestones | YES under project | YES | NO top-level | project access | NO | milestones/timeline APIs | PARTIAL | project-context only |
| Approvals | YES | YES | YES | authenticated | NO | approval APIs | YES | auth/data |
| Owner/customer portal | YES | YES | limited/indirect | owner/customer/project | NO | portal/client APIs | PARTIAL | role/project/data-gated |
| Stakeholder finance portal | stakeholder routes/APIs exist | PARTIAL | limited/indirect | stakeholder | NO | portal/stakeholder APIs | PARTIAL | role/project-data gated; finance isolation constraints |
| AI/Copilot | YES | YES | YES dashboard/public | auth/public mixed | env/backend | AI/Copilot APIs | PARTIAL | AI runtime/env/fallbacks; Flywheel blocked |
| Admin | YES | YES | PARTIAL | admin | NO | admin APIs/Edge | PARTIAL | nav exposes only push/jobs; many admin routes hidden |
| Settings | YES | YES | YES | authenticated | NO | auth methods API | YES | auth/data |

## Reachability Findings
- Public header is strong and includes Cabinet/Dashboard CTA on desktop and mobile.
- Dashboard shell has broad but incomplete navigation; many routed admin/project/client/owner pages are reachable only indirectly or by URL.
- The new reports export API has no UI entry point.
- Admin AI/review/training consent surfaces exist only in external branches and remain blocked by AI backend/migrations.
