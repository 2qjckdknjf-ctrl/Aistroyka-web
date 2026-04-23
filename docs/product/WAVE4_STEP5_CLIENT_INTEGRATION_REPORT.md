# Wave 4 Step 5 — Integration (Stage G)

## G1 — Wired to existing product data

| Domain | Integration |
|--------|-------------|
| Project summary / tasks | `getProjectSummary` → `progress.tasks_done` / `tasks_total` |
| Milestones | `milestone.repository.listByProject` + `client_visible` + non-archived filter |
| Documents | `document.repository.listByProject` + `client_visible` + non-archived filter |
| Budget | `getBudgetSummary` when `client_show_budget_summary` |
| Decisions | Document statuses on **visible** documents only |

## G2 — Separation of views

- Manager project detail remains the operational hub.
- Client view is a **narrow** route that only consumes `client-view` API.

## G3 — Intentionally not touched

- Public marketing site, anonymous routes
- Worker mobile apps
- Billing / Stripe
- Chat / notifications platform (no new notification type for portal in this step)
- Full CRM or sales pipeline
