# Wave 4 Step 21 — Backend report (Stage B)

## Schema

**Migration:** `apps/web/supabase/migrations/20260409120000_project_commercial_items.sql`

### `project_commercial_items`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `tenant_id`, `project_id` | FKs |
| `kind` | `invoice` \| `expected_revenue` \| `deposit` \| `credit_note` \| `other` |
| `title`, `description` | Required title; optional description |
| `amount` | `numeric(14,2)` |
| `currency` | Default `RUB` |
| `due_date` | `date`, optional |
| `status` | `draft` \| `issued` \| `due` \| `overdue` \| `paid` \| `cancelled` |
| `paid_at` | Set when moving to `paid` |
| `linked_change_order_id` | → `project_change_orders` |
| `linked_document_id` | → `project_documents` |
| `created_by` | User |

### `project_commercial_item_events`

Append-only: `created`, `status_change`, `payment_recorded`, `updated` (reserved for future non-status updates).

## RLS

Same pattern as change orders: **internal** read/write via `is_internal_tenant_reader_for_tenant`; **portal stakeholders** read via `is_portal_stakeholder_for_project`.

## Domain

| Layer | Path |
|-------|------|
| Types | `lib/domain/commercial/commercial.types.ts` |
| Overdue helpers | `lib/domain/commercial/commercial.overdue.ts` |
| Repository | `lib/domain/commercial/commercial.repository.ts` |
| Service | `lib/domain/commercial/commercial.service.ts` |
| Policy | `lib/domain/commercial/commercial.policy.ts` (delegates to change-order policy) |

## API

| Method | Route |
|--------|--------|
| GET | `/api/v1/projects/:id/commercial-items` |
| POST | `/api/v1/projects/:id/commercial-items` |
| GET | `/api/v1/projects/:id/commercial-items/:itemId` |
| PATCH | `/api/v1/projects/:id/commercial-items/:itemId` |

Create always starts as **draft**. Links validated against tenant + project.

## Portfolio / summary aggregates

- `getCommercialAggregatesForProject` — counts overdue (including effective overdue before DB refresh), sums outstanding in **budget currency** only.
- `countTenantCommercialOverdue` — tenant-wide overdue + open-unpaid counts for portfolio signals.
