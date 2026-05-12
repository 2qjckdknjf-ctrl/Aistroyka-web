# Phase 2 — Owner portal security audit

**Scope:** Customer / property-owner portal (`/portal`, `/api/v1/portal/*`) vs internal workspace.  
**Date:** 2026-05-07

## Threat model (abbrev.)

- **T1** Stakeholder accesses another tenant’s project.  
- **T2** Stakeholder calls internal-only APIs (costs, system, manager actions).  
- **T3** Path confusion between **platform owner** (`/owner`, `/api/v1/owner/*`) and **customer** — credentials or data Leak.

## Controls

| Control | Implementation |
|--------|----------------|
| Tenant boundary | All portal handlers use `getTenantContextFromRequest` + `requireTenant`; data queries scoped by `tenant_id`. |
| Project boundary | `getClientProjectView` / `listCustomerEstimates` enforce `canReadClientPortalView` or equivalent. |
| Platform owner separation | Customer APIs live under `/api/v1/portal/*`, not `/api/v1/owner/*`. |
| No manager action feed | No import of manager-actions or workload in portal routes. |
| Lite / system surfaces | Portal APIs not added to lite allow-list; system routes remain key-gated (`requireSystemRouteAuth`). |

## Tests / evidence

- `GET /api/v1/dashboard/manager-actions` rejects `role: stakeholder` (existing test).  
- Portal route tests verify 403 mapping for denied project view.  
- Stakeholder path helper tests cover `/portal` allow/deny patterns.

## Findings

- **None blocking** for Phase 2 closure.  
- **Residual:** Proof content is **token-based** today; `/api/v1/portal/.../proof` returns policy text only — acceptable until gallery scope is defined.

## Verdict

**Accept for Phase 2** — customer surface remains separated from platform owner URLs and internal finance routes.
