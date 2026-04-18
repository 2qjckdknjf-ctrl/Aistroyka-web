# Phase 3 — Inventory (Budget / Cost Live Activation)

**Date:** 2026-04-18  
**Stage:** A — Current Truth Inventory  
**Scope lock:** cost, change-order, and commercial activation loop only.

## What Exists (repo truth)

### Cost APIs and domain

- `GET/POST /api/v1/projects/:id/costs`
- `GET/PATCH /api/v1/projects/:id/costs/:costItemId`
- Domain layer:
  - `apps/web/lib/domain/costs/cost.service.ts`
  - `apps/web/lib/domain/costs/cost.repository.ts`
  - `apps/web/lib/domain/costs/cost-signals.ts`

### Change-order APIs and domain

- `GET/POST /api/v1/projects/:id/change-orders`
- `GET/PATCH /api/v1/projects/:id/change-orders/:changeOrderId`
- `POST /api/v1/projects/:id/change-orders/:changeOrderId/transition`
- Domain layer:
  - `apps/web/lib/domain/change-orders/change-orders.service.ts`
  - `apps/web/lib/domain/change-orders/change-orders.repository.ts`
  - `apps/web/lib/domain/change-orders/change-orders.policy.ts`

### Commercial APIs and domain

- `GET/POST /api/v1/projects/:id/commercial-items`
- `GET/PATCH /api/v1/projects/:id/commercial-items/:itemId`
- Domain layer:
  - `apps/web/lib/domain/commercial/commercial.service.ts`
  - `apps/web/lib/domain/commercial/commercial.repository.ts`
  - `apps/web/lib/domain/commercial/commercial.policy.ts`
  - `apps/web/lib/domain/commercial/commercial.overdue.ts`

### Data model

- `project_cost_items`
- `project_change_orders`
- `project_change_order_events`
- `project_commercial_items`
- `project_commercial_item_events`

Migration anchors:
- `apps/web/supabase/migrations/20260402120000_project_change_orders.sql`
- `apps/web/supabase/migrations/20260409120000_project_commercial_items.sql`

## What Was Broken Before Phase 3 Activation

1. Staging lacked change-order and commercial API routes (runtime `404`).
2. Cost summary response in staging did not include cost-pressure signal enrichment.
3. Budget-to-commercial linkage loop was not runtime-proven end-to-end.

## Phase 3 Closure Targets

1. Runtime-proven cost lifecycle with summary/signal enrichment.
2. Runtime-proven change-order creation/edit/transition path.
3. Runtime-proven commercial lifecycle linked to change-order (`draft -> issued -> due -> paid`).
4. No unresolved blocking tail for budget/cost activation semantics.
