# Wave 4 Step 19 — Traceability read model (Stage B)

## B1 — Unified trace item shape

Implemented in `apps/web/lib/domain/traceability/traceability.types.ts` as `TraceItem`:

- **id** — Stable string (`coe:`, `hoe:`, `pde:`, `sre:`, `sde:`, `pdevent:`, `rae:` + UUID).
- **occurredAt** — ISO timestamp from source row.
- **entityType** — `change_order` | `handover` | `defect` | `aftercare_request` | `discussion` | `discussion_entry` | `document` | `report_approval`.
- **entityId** — Primary subject id (change order id, defect id, discussion *entry* id for entries, etc.).
- **action** — e.g. `status_transition`, `document_lifecycle`, `discussion_entry`, `report_approval`.
- **title / summary** — Human-readable one-liners.
- **previousState / newState** — Populated for status transitions; document events use `newState` = `event_type`.
- **actorType** — `user` or `system` (e.g. null actor on some events).
- **actorId / actorLabel** — Id when present; label reserved (currently null).
- **reasonNote** — From `note` columns where available.
- **audience** — `internal_workspace` vs `stakeholder_visible` (explainability; API still enforces auth).
- **source** — Which physical table the row came from.
- **targetUrl** — Deep link into existing product surfaces (tabs, daily reports).
- **linkedPointers** — Zero or more **FK-backed** cross-entity references (see governance doc).

Pure mapping functions live in `traceability.mappers.ts` for testability.

## B2 — Normalized assembly service

`getProjectTraceability(supabase, projectId, tenantId, limit)` in `traceability.repository.ts`:

1. Loads event rows **scoped by `project_id` and `tenant_id`** where those columns exist.
2. Loads `project_document_events` for documents belonging to the project.
3. Resolves `report_approval_events` for reports linked via **project tasks** or **project_documents.report_id**.
4. Batch-loads parent rows (`project_change_orders`, `project_defects`, `project_service_requests`, `project_stakeholder_discussions`) for titles and link columns.
5. Maps to `TraceItem`, sorts by `occurredAt` descending, applies limit (max 200).

## B3 — Curated vs raw

The API returns **structured DTOs**, not table dumps. Internal columns and unrelated schemas are not exposed.

## API

`GET /api/v1/projects/:id/traceability?limit=` — **internal workspace only** (`getProjectForInternalWorkspace`); portal-only stakeholders receive 403.
