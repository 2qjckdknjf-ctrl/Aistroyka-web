# Wave 4 Step 21 — Commercial scope inventory (Stage A)

## A1 — Related systems reviewed

| Area | Role for commercial control |
|------|----------------------------|
| Documents / contracts / acts | Optional `linked_document_id` on a commercial line |
| Budget / cost | Outstanding amounts align to **budget currency** for aggregation; costs remain the spend side |
| Change orders | Optional `linked_change_order_id` — commercial impact tied to approved variation context |
| Handover / completion | Deferred automation; leadership uses commercial tab before close-out |
| Portfolio / executive reporting | Portfolio summary + review packs surface **overdue / open unpaid** counts |

## A2 — Minimal scope chosen (this step)

1. **Project commercial lines** (`project_commercial_items`) — explicit billing/revenue rows, not a ledger.
2. **Lifecycle** — draft → issued → due / overdue → paid / cancelled.
3. **Payment tracking** — `paid_at` when status becomes `paid`.
4. **Overdue** — `due_date` before today while still open; DB refresh to `overdue` status on read paths.
5. **Leadership surfaces** — project summary card, **Commercial** tab, project + portfolio review packs, portfolio command banner.

## A3 — Fields per commercial item

| Concept | Storage |
|---------|---------|
| Type | `kind` (invoice, expected_revenue, deposit, credit_note, other) |
| Title / description | `title`, `description` |
| Project | `project_id` |
| Change order | optional `linked_change_order_id` |
| Document | optional `linked_document_id` |
| Amount / currency | `amount`, `currency` (default RUB) |
| Due | `due_date` (date) |
| Status | finite enum |
| Paid | `paid_at` |
| Rationale | `description` + kind/title |

## A4 — Explicitly deferred

- Tax engine, VAT, withholding  
- General ledger / journal export  
- Full AR/AP, dunning automation, bank reconciliation  
- Installment engines beyond due date + status  
- Payroll, procurement AP  

## Conclusion

Smallest **control** layer: **what is billed, what is due, what is paid**, with **change-order and document linkage**, integrated into **project and portfolio** leadership views — not ERP.
