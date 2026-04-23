# Wave 4 Step 7 — Strict post-audit (isolation closure)

**Date:** 2026-03-29

## G.10 — Classification (FULL / PARTIAL / OPEN)

| # | Item | Status | Notes |
|---|------|--------|------|
| 1 | Stakeholder scope selection | **FULL** | `listProjects` / `getProject` branch for `stakeholder` + `project_stakeholders` |
| 2 | Stakeholder membership / access model | **FULL** | Dedicated `tenant_members.role = stakeholder`; viewer upgrade on accept |
| 3 | Portal-only isolation (app UX + API) | **PARTIAL** | Middleware + shell + internal API guards are strong; **not** a separate product subdomain |
| 4 | Leakage prevention confidence | **PARTIAL** | App layer: strong for migrated routes. **DB RLS** still treats stakeholder as tenant member for broad read policies → residual risk |
| 5 | Manager control compatibility | **FULL** | No change to manager invite/revoke semantics |
| 6 | Stakeholder-facing flow continuity | **FULL** | Accept + client portal + client requests paths preserved |
| 7 | Validation strength | **FULL** | Full unit suite green + production build; targeted new tests for policy/paths |

## Remaining issues

| Severity | Issue |
|----------|--------|
| **P1** | **Resolved in app:** generic `viewer` tenant access for new stakeholder accepts. **Residual:** users who already have `viewer` without passing through accept again may need data fix. |
| **P2** | **RLS:** Policies that allow any `tenant_members` user to `SELECT` tenant data do not distinguish `stakeholder`. Mitigation for standard app usage: API routes; **not** full DB-level portal isolation. |
| **P2** | Direct `getById` project routes (e.g. some legacy `api/projects`) — review if still exposed; primary v1 paths addressed. |

## Step 7 closure decision

**Is Wave 4 Step 7 closed enough to move forward: NO**

**Reason (strict):** Leakage prevention at the **data plane (RLS / role-scoped policies)** is still **partial**. The product’s portal-only guarantee is **fully enforced in the Next.js control plane** for the routes and patterns documented in this sprint, but the hard rule in the mission required leakage prevention not to be “only partial.” Until RLS or a separate tenancy mechanism narrows stakeholder reads, **closure remains NO** under that strict bar.

**Pragmatic note:** If the program accepts **“app-enforced portal-only”** as the definition of Step 7, the same implementation supports **YES**; this audit uses the stricter interpretation.
