# Phase 2 — Owner portal access model (property owner / customer)

**Status:** Phase 2 implementation baseline (2026-05-07)  
**Authority:** `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md`

## Naming: “owner” vs URLs

In the roadmap, **owner / customer** means the **property owner or client** who receives the portal, not the **platform owner** (AISTROYKA operations cabinet).

To avoid clashing with existing routes:

| Roadmap (concept) | Implemented URL | Notes |
|-------------------|-----------------|-------|
| `/owner` (UI) | `/{locale}/portal` → redirect → `/{locale}/portal/projects` | Platform cabinet stays at `/{locale}/owner` (platform owner). |
| `/owner/projects` | `/{locale}/portal/projects` | Project picker; opens existing client UI. |
| `/owner/projects/:id` | `/{locale}/dashboard/projects/:id/client` | Canonical experience (tabs: progress, documents, CO, etc.). |
| `GET /api/v1/owner/projects` | `GET /api/v1/portal/projects` | Customer-safe list. |
| `GET /api/v1/owner/projects/:id` | `GET /api/v1/portal/projects/:id` | Same payload shape as `GET /api/v1/projects/:id/client-view`. |
| Sub-resources (`…/progress`, `…/documents`, …) | Same under `/api/v1/portal/projects/:id/…` | Thin slices over the same read model / customer estimates. |

Forbidden for this persona (see roadmap): internal costs, budget tabs, manager action feed, `/api/v1/system/*`, manager cost routes.

## Roles (canonical)

| Role / context | Tenant `tenant_members.role` | Project access |
|----------------|------------------------------|----------------|
| Internal manager | `owner`, `admin`, `member`, `viewer` | `project_members`; full dashboard (except where RBAC restricts). |
| Portal-only stakeholder | `stakeholder` | `project_stakeholders` active row + `client_portal_enabled`. |
| Project owner (membership) | any internal role | `project_members.role = owner` on project + portal enabled — treated as client-side owner for portal listing. |

**Platform owner** uses `/{locale}/owner` and `/api/v1/owner/*` with separate gates — unrelated to customer portal.

## Data visibility (summary)

Aligned with roadmap matrix §2.2:

- **Customer** sees: client-visible milestones/documents, client requests, commercial customer estimates (sent+), approved/rejected commercial states, change orders **without** internal budget language, handover summary when exposed, progress task counts.
- **Customer** does not see: `project_cost_items`, internal budget/margin/risk, manager digest, manager workload signals, raw AI diagnostics, audit logs, `/api/v1/dashboard/manager-actions`.

## Manager linking

Managers invite stakeholders and enable `client_portal_enabled` on the project (existing flows). Portal list API only returns projects with portal **on** and an eligible membership/stakeholder row.

## Related code

- Read model: `apps/web/lib/domain/client-portal/client-portal.service.ts` (`getClientProjectView`).
- Portal aggregation: `apps/web/lib/domain/portal/portal.service.ts`.
- Stakeholder path policy helper: `apps/web/lib/tenant/stakeholder-dashboard-paths.ts` (extend with `/portal`).
