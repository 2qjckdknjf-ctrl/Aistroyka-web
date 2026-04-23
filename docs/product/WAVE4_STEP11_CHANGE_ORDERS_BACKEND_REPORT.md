# Wave 4 Step 11 — Backend report (Stage B)

## Schema

**Migration:** `apps/web/supabase/migrations/20260402120000_project_change_orders.sql`

- **`project_change_orders`:** `id`, `tenant_id`, `project_id`, `kind`, `status`, `title`, `description`, structured `schedule_impact_level` / `budget_impact_level`, `schedule_impact_summary`, `budget_impact_summary`, optional `schedule_delta_days`, `budget_delta_amount`, optional FKs to discussion, document, client request, milestone, `created_by`, `implemented_at`, `implemented_by`, timestamps.

- **`project_change_order_events`:** append-only audit of transitions: `from_status`, `to_status`, `actor_user_id`, optional `note`, timestamps.

## RLS

- **SELECT** orders and events: internal tenant readers **or** portal stakeholders on the project.
- **ALL** writes on `project_change_orders`: **internal only** (managers via app).
- **INSERT** events: **internal only** (status transitions performed by managers).

## Domain

| Path | Role |
|------|------|
| `lib/domain/change-orders/change-orders.types.ts` | Kinds, statuses, impact levels, manager vs public DTOs. |
| `change-orders.repository.ts` | CRUD, events, `listForTimeline`. |
| `change-orders.policy.ts` | Read: `canReadClientPortalView`; manage: `canManageClientRequests`. |
| `change-orders.service.ts` | Create, list (draft hidden from stakeholders), detail, PATCH content (editable statuses), transition with validation + event insert. |

## API

| Method | Path |
|--------|------|
| GET, POST | `/api/v1/projects/[id]/change-orders` |
| GET, PATCH | `/api/v1/projects/[id]/change-orders/[changeOrderId]` |
| POST | `/api/v1/projects/[id]/change-orders/[changeOrderId]/transition` body: `{ to_status, note? }` |

## Non-breaking

Additive only; no changes to existing discussion, document, or budget APIs beyond new FK references.
