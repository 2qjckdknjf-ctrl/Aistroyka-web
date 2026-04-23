# Wave 4 Step 11 — Executive summary

Shipped a **formal change orders / variations layer**: auditable records with kinds, lifecycle, schedule/budget impact, optional links to discussions and other project entities, manager workflow, and controlled stakeholder visibility. This is **not** ERP, legal automation, or generic ticketing.

**Implementation highlights**

- Tables: `project_change_orders`, `project_change_order_events`.
- Domain: `lib/domain/change-orders/*`.
- API: `/api/v1/projects/[id]/change-orders` (+ detail, PATCH, transition).
- UI: `ChangeOrdersManagerPanel`, manager detail, client list/detail, portal promo card.
- Timeline: `change_order_opened`, `change_order_implemented`.

See `WAVE4_STEP11_CHANGE_ORDERS_POST_AUDIT.md` for strict ratings and P1/P2 follow-ups.
