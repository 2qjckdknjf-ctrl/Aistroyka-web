# Wave 4 Step 21 — Commercial governance rules (Stage C)

## C1 — Billing / payment lifecycle

Defined in `commercial.service.ts` (`TRANSITIONS` + `canTransitionCommercialStatus`):

| From | To |
|------|-----|
| `draft` | `issued`, `cancelled` |
| `issued` | `due`, `overdue`, `paid`, `cancelled` |
| `due` | `overdue`, `paid`, `cancelled` |
| `overdue` | `paid`, `cancelled` |
| `paid` | _(terminal)_ |
| `cancelled` | _(terminal)_ |

New rows are **draft** only.

## C2 — Overdue determination

1. **Stored:** status `overdue`.  
2. **Effective (before refresh):** `due_date` &lt; today (UTC date string) and status `issued` or `due`.  
3. **Refresh:** `refreshOverdueForProject` / `refreshOverdueForTenant` updates `issued`/`due` with `due_date` &lt; today → `overdue`.  
4. Display: UI badge shows “Overdue” when `isEffectivelyOverdue` is true.

## C3 — Change orders

Optional FK. Service verifies `project_change_orders.id` belongs to **same** `tenant_id` and `project_id`. No automatic amount sync from CO `budget_delta_amount` in this step (explicit commercial lines only).

## C4 — Each item exposes

- **Status** — enum + badge  
- **Amount** — numeric + currency  
- **Due state** — due date + overdue semantics  
- **Payment state** — `paid_at` when `paid`  
- **Context** — project; optional CO and document  

## C5 — Traceability

- **Create** → event `created`  
- **Status change** → `status_change` with `from_status` / `to_status`  

(No separate `payment_recorded` event row in MVP — payment is a status transition.)

## Limitations

- No partial payments / multi-currency rollup (outstanding sums **budget currency** lines only).  
- No automated emails or dunning.
