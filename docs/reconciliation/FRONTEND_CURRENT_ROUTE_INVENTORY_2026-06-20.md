# Frontend Current Route Inventory — 2026-06-20

## Route Families Present

| Surface | Route examples | Files | Visibility / gates | API dependency | Notes |
|---|---|---|---|---|---|
| Public site | `/{locale}`, `/features`, `/pricing`, `/enterprise`, `/solutions`, `/workflows`, `/security`, `/mobile`, `/copilot`, `/api`, `/docs`, `/cases`, `/about`, `/contact`, `/faq` | `apps/web/app/[locale]/(public)/**` | public | mixed/static | Public site exists and is routed. |
| Auth | `/login`, `/register`, `/telegram`, `/telegram/start` | `apps/web/app/[locale]/(auth)/**` | public/auth layout | auth APIs | Auth routes exist. |
| Dashboard shell | `/dashboard` and dashboard layout | `apps/web/app/[locale]/(dashboard)/layout.tsx`, `components/DashboardShell.tsx` | authenticated | many `/api/v1/*` | Shell exists and is visible after auth. |
| Projects | `/dashboard/projects`, `/dashboard/projects/[id]`, `/projects`, `/projects/[id]`, `/projects/new` | dashboard project pages | authenticated | `/api/v1/projects*` | There are duplicate/parallel project route families. |
| Reports | `/dashboard/reports`, `/dashboard/reports/[id]`, `/dashboard/daily-reports`, `/dashboard/daily-reports/[id]` | dashboard reports pages | authenticated | `/api/v1/reports*` | Reports UI exists; new backend export route has no visible UI entry yet. |
| Documents | project document routes and approval history | project detail subroutes/components | authenticated | `/api/v1/projects/[id]/documents*` | Exists under project context, not a top-level nav item. |
| Costs/budget | project costs APIs and dashboard/project surfaces | project detail components/routes | authenticated, internal manager | `/api/v1/projects/[id]/costs*` | Must remain internal; not customer-facing. |
| Schedule/milestones | `/api/v1/projects/[id]/milestones*`, timeline blocks | project pages/components | authenticated | milestones/timeline APIs | Exists as project-level feature, not top-level nav. |
| Approvals | `/dashboard/approvals`, approval components | `components/approvals/*` | authenticated | reports/documents approval APIs | Top-level nav link exists. |
| Owner/customer portal | `/owner`, `/dashboard/projects/[id]/owner`, `/dashboard/projects/[id]/client/**`, `/portal/projects` | owner/client/portal pages | auth/role/project access | portal/client APIs | Exists but reachability depends on role/project data. |
| Stakeholder portal | `/portal`, `/portal/projects`, stakeholder project APIs | portal pages and stakeholder APIs | auth/role/project membership | `/api/v1/portal/*` | Exists; role-restricted. |
| AI/Copilot | `/dashboard/ai`, `/dashboard/ai/[id]`, `/projects/[id]/ai`, public `/copilot` | dashboard and public AI pages | auth/public mixed; AI env dependent | Copilot/AI APIs | User-facing AI exists; deeper Flywheel/Admin AI surfaces blocked externally. |
| Admin | `/admin`, `/admin/jobs`, `/admin/push`, `/admin/ai*`, `/admin/system`, etc. | admin pages/layout | admin role | admin/Edge APIs | Many admin routes exist but dashboard nav only exposes Push/Jobs. |
| Settings | `/dashboard/settings/auth` | settings page | authenticated | auth methods API | Visible in sidebar. |

## Important Notes
- Dashboard sidebar currently exposes only a subset of existing routes.
- Current `DashboardShell` nav includes reports, approvals, AI, uploads, devices, settings, help, admin push/jobs only.
- New reports CSV export backend route exists, but no UI button/link was added.
- Route inventory is static; runtime visibility still depends on auth, tenant membership, data, and flags/env.
