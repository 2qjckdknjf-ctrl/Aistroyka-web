# Construction Graph

Postgres graph overlay. **Not** a second system of record. **Not** Neo4j.

## Tables

- `construction_entities` — `id, tenant_id, project_id, entity_type, source_type, source_id, metadata, created_at, updated_at`
- `construction_relations` — `from_entity_id, relation_type, to_entity_id` plus tenant/project scope

Unique source bind: `(tenant_id, project_id, source_type, source_id)`.

## Rules

- Traversal is always `tenant_id` + `project_id`. RLS requires `is_internal_tenant_reader_for_tenant` **and** `can_read_project_membership` (tenant owner/admin or active project member). Stakeholders cannot read graph/agent rows.
- Binding is idempotent (`upsert` on the unique source key).
- A `Task` node points at `worker_tasks.id`; the task row remains authoritative.

## Context mapping

Canonical mapping lives in `apps/web/lib/agentic/graph/construction-context.ts` (`CONSTRUCTION_CONTEXT_MAPPING`).

Spatial types (Building/Floor/Zone/Room) and procurement types are **extensible graph types** without new physical tables in Slice 01.

## Relation types

`LOCATED_IN`, `DEPENDS_ON`, `BLOCKS`, `ASSIGNED_TO`, `PERFORMED_BY`, `SUPPORTED_BY`, `EVIDENCED_BY`, `REQUIRES`, `USES_MATERIAL`, `SUPPLIED_BY`, `CREATED_FROM`, `RESOLVES`, `VERIFIES`, `AFFECTS`, `PART_OF`.

Task dependency edges are **not** invented: production schema has no `task_dependencies` table. Blockers use overdue / in-progress / missing-report signals and `project_defects.is_blocking`.
