# Wave 4 Step 7 — Isolation inventory (closure sprint)

**Date:** 2026-03-29  
**Scope:** External stakeholder portal vs internal workspace surfaces after isolation work.

## A1 — Surfaces after accept / login (app routes)

Prior risk: accepting a stakeholder invite inserted `tenant_members.role = viewer`, which satisfied `canReadProjects` and allowed navigation across the standard dashboard shell (tasks, workers, approvals, billing links, etc.).

### Allowed (portal-oriented)

| Surface | Purpose |
|--------|---------|
| `/[locale]/dashboard/stakeholder-invite` | Token acceptance |
| `/[locale]/dashboard/projects` | Project picker scoped to stakeholder-authorized projects |
| `/[locale]/dashboard/projects/[id]/client` | Client portal UI (curated `client-view` + client requests) |
| `GET /api/v1/projects` | List projects (stakeholder: only `project_stakeholders` active rows) |
| `GET /api/v1/projects/[id]` | Project row + `stakeholder_role` metadata for UI |
| `GET /api/v1/projects/[id]/client-view` | Curated portal DTO |
| Client request routes scoped by `client-requests` policy | As before |

### Blocked or redirected (stakeholders)

| Surface | Mechanism |
|---------|-----------|
| `/dashboard` (overview) | Middleware → `/dashboard/projects` |
| `/dashboard/projects/[id]` (manager project hub) | Middleware → `/dashboard/projects/[id]/client` |
| `/dashboard/tasks`, `/workers`, `/reports`, `/approvals`, `/uploads`, `/devices`, `/ai`, `/alerts`, `/notifications`, `/team`, etc. | Middleware → `/dashboard/projects` |
| `/projects/*` (alternate shell) | Middleware → `/dashboard/projects` |
| `/billing`, `/admin`, `/portfolio` | Middleware → `/dashboard/projects` |
| Internal project APIs (summary, timeline, media, workers, intelligence, copilot, AI helpers, etc.) | `getProjectForInternalWorkspace` + `canReadProjects` false for stakeholder |

### Main prior leak risk

1. **Tenant role `viewer`** implied internal workspace reader semantics (`canReadProjects` true).  
2. **UI:** Full `DashboardShell` exposed internal nav links.  
3. **API:** Many routes used `getProject()` only; stakeholders could call internal aggregates if they hit URLs directly.

## A2 — Classification

### ALLOWED

- Portal-only customer surfaces and stakeholder-authorized project listing.
- Client portal projection (`client-view`) and client requests/respond flows authorized by `stakeholders.policy` / `client-requests.policy`.

### NOT ALLOWED (target)

- Broad manager dashboard sections and workspace-wide tools not curated for stakeholders.
- Internal project hub (`DashboardProjectDetailClient` full view) for portal-only users.
- Internal-only aggregates (summary, attention manager mode, timeline, etc.) for stakeholders.

## A3 — Residual notes

- **Supabase RLS** still grants tenant membership to `stakeholder` rows where policies only require “any `tenant_members` row for this tenant.” That is **not** narrowed in this sprint; see policy report.
