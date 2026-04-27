# Wave 4 Step 12 — Backend report (Stage B)

## Persistence

**Migration:** `apps/web/supabase/migrations/20260403100000_project_handover.sql`

- **`project_handover`:** one row per `project_id` (`unique (project_id)`), `status`, `handover_notes`, `handed_over_at` / `handed_over_by`, `completed_at` / `completed_by`, timestamps.
- **`project_handover_events`:** append-only transitions (`from_status`, `to_status`, `actor_user_id`, `note`).

## Readiness

**Module:** `lib/domain/project-handover/handover-readiness.ts` — `computeHandoverReadiness(supabase, projectId, tenantId)` returns `{ ready: boolean, blockers: HandoverBlocker[] }`. Uses `getProjectSummary` plus targeted counts on `project_documents`, `project_change_orders`, `project_stakeholder_discussions`, `project_client_requests`.

## Service / API

| Path | Role |
|------|------|
| `project-handover.service.ts` | `getHandoverForManager`, `getHandoverPublicSummary`, `transitionHandover` (gates `handover_ready` and `handed_over` on `ready === true`). |
| `project-handover.repository.ts` | CRUD handover row, events, timeline helper. |
| `project-handover.policy.ts` | Manage: `canManageClientRequests`; read portal: `canReadClientPortalView`. |

| Method | Route |
|--------|--------|
| GET | `/api/v1/projects/[id]/handover` — manager payload vs stakeholder summary. |
| POST | `/api/v1/projects/[id]/handover/transition` — `{ to_status, note? }` |

## RLS

Aligned with prior Wave 4 patterns: select for internal readers or portal stakeholders; writes internal-only.
