# Release Hardening — Security Wave 11

Date: 2026-09-06
Scope: aftercare schema bootstrap + portal tenant scope
Master tracker: #282

## Production reconciliation finding

Read-only live Supabase inspection found:
- historical migration `20260405120000_project_aftercare_service_requests.sql` is absent from `supabase_migrations.schema_migrations`;
- `public.project_service_requests` is absent;
- `public.project_service_request_events` is absent;
- later hardening migration `20260906114000_harden_aftercare_assignments_sync_cursors.sql` references both tables directly and therefore cannot apply successfully on the current live schema.

This proves the live migration ledger is not a simple contiguous prefix of the repository migration history. Blind replay of every missing historical migration is unsafe.

## Bootstrap strategy

Add `20260906113500_bootstrap_missing_aftercare_tables.sql`, ordered immediately before `114000`.

It is intentionally fail-closed:
- `CREATE TABLE IF NOT EXISTS` for both aftercare tables;
- `CREATE INDEX IF NOT EXISTS` for their indexes;
- enables RLS;
- creates read policies only when those policies are absent;
- does **not** recreate the historical broad internal reader-as-writer policy;
- does **not** create portal INSERT yet.

Then existing `114000` creates the hardened project-manager internal write policies and constrained portal initial-event policy.

## Portal tenant-scope finding

The historical `project_service_requests_insert_portal` policy proves the caller is a stakeholder of `project_id`, but it does not prove `tenant_id` belongs to that project. A direct authenticated PostgREST caller could therefore forge a cross-tenant aftercare row.

The supported `createServiceRequestStakeholder` service always controls the critical row shape:
- `tenant_id = ctx.tenantId`;
- `project_id = projectId`;
- `status = reported`;
- `coverage_type = warranty_review_needed`;
- `assigned_to = null`;
- `due_date = null`;
- `linked_handover_id = gate.handoverId` from a handed-over/completed project;
- `linked_defect_id = null`;
- `linked_discussion_id = null`;
- `created_by = ctx.userId`.

## Final portal/read hardening

Add `20260906125500_harden_aftercare_portal_tenant_scope.sql`, ordered after `114000` and Wave 10 `125000`.

It reasserts:
- request SELECT requires `project_belongs_to_tenant(project_id, tenant_id)` plus authorized reader/stakeholder;
- event SELECT additionally requires the referenced service request to have the same tenant/project;
- stakeholder INSERT requires row tenant/project consistency, caller ownership, server-controlled status/coverage/null fields, and a linked handover belonging to the same tenant/project in `handed_over|completed` state.

## Regression coverage

`aftercare-bootstrap-portal-scope.hardening.test.ts` locks:
- ordering `113500 < 114000 < 125500`;
- idempotent/fail-closed bootstrap behavior;
- absence of the historical broad internal write policy in bootstrap;
- existing `114000` responsibility for hardened internal writes and initial portal event;
- final project/tenant binding for request/event reads and portal INSERT;
- parity with the actual stakeholder service-controlled fields.

## Safety

- no production mutation
- no migration apply
- no historical migration replay
- no deploy
- Draft stacked PR only
- intended for exact cumulative CI/iOS/Android validation before any controlled database rollout
