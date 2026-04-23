# Wave 4 Step 15 — Portfolio backend report

## Read model

**Assembler:** `lib/domain/portfolio/portfolio-control.service.ts` → `buildPortfolioControl(supabase, ctx)`

**Per project (limited to 20 per request):**

1. `getProjectSummary` — same aggregates as project dashboard (`project-summary.repository`).  
2. `deriveProjectStatus` — existing deterministic health/status (`project-status.service`).  
3. `computeHandoverReadinessFromSummary` — **refactored** from `computeHandoverReadiness` to accept a pre-fetched summary (`handover-readiness.ts`).  
4. `countOpenByProject` — aftercare rows not closed (`aftercare.repository`).

**Output:** `PortfolioControlResult` + `PortfolioProjectControlRow` (`portfolio-control.types.ts`).

## HTTP

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/portfolio/control` | JSON portfolio control payload |

## Auth / tenant

- `getTenantContextFromRequest` + `requireTenant`.  
- Projects via `listByTenant(supabase, tenantId)` — same tenant boundary as other project APIs.

## Risks

- **Performance:** O(n) projects × (summary + handover queries + aftercare count). Capped at **20** projects per call.  
- **Aftercare table:** if migration not applied, aftercare count returns 0 (error-swallowed in repository).
