# Wave 4 Step 7 — Policy / leakage report

**Date:** 2026-03-29

## D1 — APIs reviewed (stakeholder path)

| Area | Stakeholder behavior |
|------|----------------------|
| `canReadProjects` / domain services using it (documents, costs, milestones, issues, media) | **Denied** — stakeholder fails tenant read gate |
| `getProjectForInternalWorkspace` | **403** for internal aggregates |
| `GET /api/v1/projects/[id]/summary` | Uses internal workspace helper → **403** |
| `GET /api/v1/projects/[id]/estimate` | Explicit stakeholder guard + not internal workspace |
| `client-view`, client-requests | Unchanged; authorized via `stakeholders.policy` |

## D2 — Curated DTOs

- Portal remains **`getClientProjectView`** and public client-request mappers.  
- **GET `/api/v1/projects/[id]`** still returns the **full project row** from `projects` for stakeholders who pass `getProject`. Mitigation: stakeholders are redirected off internal UI; **sensitive columns** should be reviewed separately if any exist on `projects` (product-specific).

## D3 — Denied internal access

- **Automated:** `getProjectForInternalWorkspace` on listed internal routes.  
- **Policy:** `ctx.role === "stakeholder"` cannot pass `canReadProjects`-gated services.

## D4 — Leakage confidence

| Layer | Confidence |
|-------|------------|
| Next.js API routes touched for internal workspace | **High** for migrated handlers |
| Middleware navigation | **High** for listed prefixes |
| **Supabase RLS** (any `tenant_members` row) | **Partial** — many policies only check membership in tenant, not `role <> 'stakeholder'`. A custom client using the anon key and direct table access could exceed portal intent. **Not closed at DB layer in this sprint.** |

## D5 — Explicit checks added in tests

- `lib/tenant/stakeholder-dashboard-paths.test.ts` — path redirect matrix  
- `lib/tenant/tenant.policy.test.ts` — stakeholder RBAC denial  
- Copilot stream route test updated for `getProjectForInternalWorkspace`
