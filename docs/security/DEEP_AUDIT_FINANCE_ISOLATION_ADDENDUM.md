# Deep Audit Finance Isolation Addendum

Date: 2026-05-25  
Reason: critical finding during deep audit for customer-finance isolation boundary

## Critical boundary issue

Internal estimate intelligence is currently exposed through a project estimate endpoint that does not enforce internal-role authorization strongly enough for customer/stakeholder boundaries.

Primary evidence:

- `apps/web/app/api/v1/projects/[id]/estimate/route.ts`
- `apps/web/lib/domain/estimate/estimate.service.ts`
- `apps/web/supabase/migrations/20260329140000_stakeholder_rls_isolation.sql`
- `apps/web/supabase/migrations/20260307600000_project_estimate_results.sql`

## Why this violates roadmap policy

Roadmap rule (`docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md`) forbids exposing internal costs, margins, overrun signals, and internal finance intelligence to customer/owner/stakeholder surfaces. Internal estimate-range artifacts derived from budget snapshots fall into that forbidden class unless explicitly sanitized into customer-commercial documents.

## Immediate containment checklist (P0)

1. Restrict `/api/v1/projects/:id/estimate` to internal manager roles only.
2. Introduce explicit customer-safe projection route if needed (commercial-only payload).
3. Update RLS on `project_estimate_results` to deny stakeholder/customer read access by default.
4. Add deny tests:
   - stakeholder -> `/api/v1/projects/:id/estimate` returns 403
   - portal routes never include forbidden finance keys
5. Extend stakeholder live sanity script to include estimate-surface deny checks.

## Suggested regression tests

- Route-level:
  - `apps/web/app/api/v1/projects/[id]/estimate/route.test.ts` (new)
- Domain-level:
  - estimate service shaping tests for internal-only payload
- Security-level:
  - guard-forbidden-key tests for customer-facing routes

## Closure criteria for this addendum

Mark this addendum closed only when all are true:

1. API route denies stakeholder/customer access to internal estimate intelligence.
2. RLS policy for estimate results is consistent with customer-finance isolation.
3. Tests cover deny path in CI.
4. Live stakeholder sanity includes estimate-route negative check and passes.
5. Final security audit documents are updated with explicit closure evidence.
