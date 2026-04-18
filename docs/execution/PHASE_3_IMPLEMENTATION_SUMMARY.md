# Phase 3 — Implementation Summary

**Date:** 2026-04-18  
**Status:** Runtime-validated in staging.

## Implemented in this phase

1. Activated change-order API surface:
   - `apps/web/app/api/v1/projects/[id]/change-orders/route.ts`
   - `apps/web/app/api/v1/projects/[id]/change-orders/[changeOrderId]/route.ts`
   - `apps/web/app/api/v1/projects/[id]/change-orders/[changeOrderId]/transition/route.ts`

2. Activated commercial API surface:
   - `apps/web/app/api/v1/projects/[id]/commercial-items/route.ts`
   - `apps/web/app/api/v1/projects/[id]/commercial-items/[itemId]/route.ts`

3. Added domain models/services/repositories/policies:
   - `apps/web/lib/domain/change-orders/*`
   - `apps/web/lib/domain/commercial/*`
   - `apps/web/lib/domain/costs/cost-signals.ts`

4. Enriched cost summary semantics:
   - Added explainable `signals` to budget summary output in cost domain.

5. Added tests for new behavior:
   - `apps/web/lib/domain/costs/cost-signals.test.ts`
   - `apps/web/lib/domain/change-orders/change-orders.service.test.ts`
   - `apps/web/lib/domain/commercial/commercial.service.test.ts`
   - `apps/web/app/api/v1/projects/[id]/commercial-items/route.test.ts`

6. Included migration artifacts for change-order and commercial layers:
   - `apps/web/supabase/migrations/20260402120000_project_change_orders.sql`
   - `apps/web/supabase/migrations/20260409120000_project_commercial_items.sql`
