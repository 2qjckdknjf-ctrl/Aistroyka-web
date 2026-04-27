# Wave 4 Step 20 — Backend report (Stage B)

## Schema

**Migration:** `apps/web/supabase/migrations/20260408120000_governance_cases.sql`

### `governance_cases`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `tenant_id` | FK → `tenants`, cascade delete |
| `title` | Required |
| `rationale` | Optional text (why it exists) |
| `status` | Check: `open`, `under_review`, `decision_required`, `decided`, `resolved`, `archived` |
| `severity` | Check: `medium`, `high`, `critical` |
| `decision_required` | Required — what decision is needed |
| `decision_outcome` | Optional until lifecycle requires it |
| `created_by`, `owned_by`, `decided_by` | User refs; `owned_by` / `decided_by` nullable |
| `decided_at`, `resolved_at` | Set by service when transitioning |
| `created_at`, `updated_at` | Trigger maintains `updated_at` |

Index: `(tenant_id, status, updated_at desc)`.

### `governance_case_projects`

Composite PK `(governance_case_id, project_id)`. Optional `note` per project. Tenant-scoped; FK to `projects`.

### `governance_case_events`

Append-only audit: `created`, `status_change`, `decision_recorded`, `updated`. Stores `from_status` / `to_status` where applicable, `actor_user_id`, optional `note`.

## Row Level Security

Policies use `public.is_internal_tenant_reader_for_tenant(tenant_id)` for select/write on cases, junction rows, and events (insert for events). Aligns with **internal workspace** governance, not portal-only stakeholders.

## Domain layer

- **Types:** `apps/web/lib/domain/governance/governance.types.ts`
- **Repository:** `governance.repository.ts` — list, get, counts, events, project hydration
- **Service:** `governance.service.ts` — create (validates **all** `project_ids` belong to tenant), update, transition rules, event writes

## API

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/governance/cases` | List with optional `status`, `severity` filters |
| POST | `/api/v1/governance/cases` | Create (requires `title`, `decision_required`, `severity`, `project_ids`) |
| GET | `/api/v1/governance/cases/[id]` | Detail |
| PATCH | `/api/v1/governance/cases/[id]` | Update fields, status, projects |

All routes: tenant context + internal workspace gate (`requireInternalWorkspace`).

## Tenant / project boundary enforcement

- Service rejects create/update if any `project_id` is not in `projects` for the same `tenant_id`.
- RLS restricts data plane by tenant membership predicate.
