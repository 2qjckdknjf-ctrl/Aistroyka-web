# Wave 4 Step 5 — Customer scope inventory (Stage A)

## A1 — Safe, high-value candidates (included in this step)

| Area | What customers (stakeholders) see | Source |
|------|-----------------------------------|--------|
| Project identity | `id`, `name` | Project row |
| Progress | Task counts done / total | Existing project summary |
| Milestones | Title, target date, status | `project_milestones` where `client_visible` |
| Documents | Title, type, status, `updated_at` | `project_documents` where `client_visible` |
| Decisions / attention | Documents in `under_review` or `changes_requested` | Derived from **visible** documents only |
| Budget (optional) | Planned total, actual total, currency, over-budget flag | `getBudgetSummary` when `client_show_budget_summary` |

## A2 — Explicitly excluded by default (not shown in client read model)

| Category | Rationale |
|----------|-----------|
| Storage paths, signed URLs, media IDs | Prevents direct file download or enumeration from the read API |
| Internal notes, audit fields, approval history detail | Manager / owner workspace only |
| Worker identities, assignments, internal reports | Not surfaced in client projection |
| Cost line items | Only aggregate totals when enabled |
| Milestones/documents with `client_visible = false` or `archived` | Never included |
| Anything when `client_portal_enabled = false` | Entire read model returns “not enabled” |

## A3 — Smallest scope chosen for Step 5

1. **Auth model**: Authenticated tenant user with **`project_members.role = owner`** for the project (customer representative). This is **not** a public or anonymous portal; it is a controlled stakeholder view inside the authenticated dashboard.
2. **Gating**: `projects.client_portal_enabled` must be true.
3. **Curation**: Per-row `client_visible` on milestones and documents (default `false`).
4. **Budget**: Optional single toggle `client_show_budget_summary` for high-level totals only.

## Deferred (out of scope for Step 5)

- Guest / magic-link access without a full tenant user
- Separate “customer” tenant role distinct from project owner
- In-portal document upload or approval (actions go through existing owner workspace flows)
- CRM, billing checkout, chat, mobile-specific client apps
