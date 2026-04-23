# Wave 4 Step 17 — Manager UI

## D1 — Surfaces

- **`RecurringOperationsPanel`** on `/[locale]/dashboard/workload` (below execution inbox)  
- **GET** `/api/v1/recurring-operations/rules` — lists rules, `last_fired_at`, `next_due_at`, cadence  
- **PATCH** `/api/v1/recurring-operations/rules/:id` — `{ active }` (owner/admin only)  

## D2 — Behaviour

- Members see rules and status; only **owner/admin** see Turn on/off.  
- Empty state explains rules appear after the next successful cron tick.  

## D3 — Scope

No dashboard home redesign; only workload page + existing notifications inbox for delivery.  

## Limitations

- No per-rule cadence editing in UI (DB supports it; API not exposed).  
- English copy in panel component.  
