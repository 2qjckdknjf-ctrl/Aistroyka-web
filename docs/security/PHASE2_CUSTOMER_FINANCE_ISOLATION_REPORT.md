# Phase 2 — Customer finance isolation (portal layer)

**Date:** 2026-05-07  
**Related:** `docs/security/CUSTOMER_FINANCE_ISOLATION_PREAUDIT.md` (Phase 0), roadmap §1.

## Summary

Phase 2 adds **customer-facing navigation and APIs** (`/portal`, `/api/v1/portal/*`) that **do not introduce new finance fields**. All project detail payloads re-use `getClientProjectView` and customer estimate listing, which are already bounded by:

- No `project_cost_items` in client read model  
- No internal budget / margin / overrun language in stakeholder change-order views (Phase 0/1)  
- Estimates endpoint returns **customer** viewer mode only (`listCustomerEstimates(..., "customer")`)

## API inventory (portal)

| Endpoint | Finance exposure |
|----------|------------------|
| `GET /api/v1/portal/projects` | `id`, `name` only |
| `GET /api/v1/portal/projects/:id` | Same as `client-view` (no internal costs) |
| `.../progress` | Task counts + client-visible milestones |
| `.../documents` | Client-visible document metadata |
| `.../decisions` | Document review queue + `ClientRequestPublic` |
| `.../estimates` | `CustomerEstimatePublic` / sent states only |
| `.../proof` | Informational JSON (share-link policy) |

## Verdict

**No new customer finance isolation regressions** identified for Phase 2 scope. Ongoing obligation: any new fields on `ClientProjectView` or portal routes must pass commercial vs internal review before merge.
