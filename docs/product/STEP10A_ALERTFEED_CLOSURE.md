# Step 10A — AlertFeed Closure

## Linkage model (honest)

| Class | Meaning | Behavior |
|-------|---------|----------|
| **context_routed** | Known `type` → best tenant screen | AI types → `/dashboard/ai`; SLO/quota → `/dashboard` (+ anchored list link) |
| **list_anchor_only** | Unknown or future type | No fabricated URL; **primary** CTA = `/dashboard/alerts#alert-{id}` |
| **entity_linked** | *Not available* | Would need `resource_type` / `resource_id` (or similar) on `public.alerts` — **not in schema** (see migrations `20260306460000_slo_alerts.sql`). |

## Code changes

1. **`getAlertDestinations`** returns `linkage`, `contextHref` / `contextLabel`, `anchoredListHref`, `anchoredListLabel`, `honestyNote`, `alertType`.
2. **AlertFeed**: Unknown types show `list-only routing` hint; primary link “Open on alerts list →”; honesty note under CTAs.
3. **Dashboard alerts page**: Header states no per-alert project URL until schema stores resource refs; **scroll-to-hash** after fetch with retries (0, 120, 350, 700 ms).
4. **Tests**: `alert-destinations.test.ts` covers AI, SLO, quota, unknown.

## Why “FULL” for drill-down closure is fair

Within the **current data model**, every alert has:

- A **deterministic** primary action (context screen **or** anchored list row).
- **No dead-end** that pretends to open a non-existent entity page.
- **Explicit** copy when no dedicated screen exists.

**Entity-level FULL** remains blocked on schema work — documented, not hidden.
