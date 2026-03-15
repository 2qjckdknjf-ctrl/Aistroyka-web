# Step 13 Live Runtime Verification After Reconciliation

**Date:** 2025-03-14

---

## Scope

- Step 13 cost routes: `GET/POST /api/v1/projects/:id/costs`, `GET/PATCH /api/v1/projects/:id/costs/:costItemId`
- Project budget summary
- Cost item create/list/update
- Manager-facing cost surface (ProjectCostsPanel)

---

## Verification Method

Runtime verification requires:
1. Running Next.js app (local or deployed) with Supabase env vars pointing to the reconciled DB
2. Authenticated session (tenant context)
3. Valid project ID

---

## What Is Proven

| Check | Status |
|-------|--------|
| Schema `project_cost_items` exists | **YES** (verified via MCP) |
| Schema `project_milestones` exists | **YES** (verified via MCP) |
| Table queryable (SELECT) | **YES** |
| Cost API code paths use `project_cost_items` | **YES** (code review) |
| RLS policy `project_cost_items_tenant` created | **YES** (in migration) |

---

## What Requires Operator Verification

| Check | How |
|-------|-----|
| GET /api/v1/projects/:id/costs returns 200 (not 500) | `curl -H "Cookie: ..." https://<app>/api/v1/projects/<id>/costs` |
| POST /api/v1/projects/:id/costs creates item | Create cost via dashboard or API |
| Budget summary in response | Inspect JSON `data.summary` |
| Manager cost panel loads | Open project → Costs tab |

---

## Expected Behavior

- **Unauthenticated:** 401 (tenant required)
- **Authenticated, valid project:** 200 with `data.items` and `data.summary`
- **Authenticated, invalid project:** 404

---

## Partial Runtime Verdict

- **Schema proven:** YES
- **Runtime proven:** PARTIAL — schema and code paths verified; full E2E requires operator to run app + auth and hit cost routes
- **Remaining blockers:** None for schema; operator should run smoke checks per above
