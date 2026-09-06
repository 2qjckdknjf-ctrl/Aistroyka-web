# AISTROYKA Release Hardening — Security Wave 4

Date: 2026-09-06
Logical dependency: Security Wave 3 / PR #286
Tracking: #282

## Scope

No product features. This wave closes the confirmed #218-class direct-PostgREST bypasses for aftercare service requests, task assignments, and cross-user sync cursors.

## Confirmed current-main findings

### Aftercare row mutations use the internal-reader cohort

Current `project_service_requests_write_internal` is a broad write policy based on `is_internal_tenant_reader_for_tenant`, which includes `viewer`.

Fix:
- internal service-request insert/update/delete requires `can_manage_project_membership`;
- insert/update requires project/tenant consistency;
- the existing strict portal request-create policy is preserved.

### Portal aftercare audit event must remain functional

The stakeholder create service writes both the request and an initial `project_service_request_events` row using the authenticated user client. Making all event inserts manager-only would silently lose the audit event.

Fix:
- manager event insert remains project-manage scoped;
- add a separate narrow portal policy allowing only the initial `reported` event when:
  - caller is a portal stakeholder on the project;
  - actor is `auth.uid()`;
  - `from_status is null`, `to_status = reported`;
  - the referenced service request is on the same tenant/project, was created by the caller, and is still `reported`.

This preserves the intended portal flow without allowing arbitrary aftercare transitions.

### Task assignments are broadly writable

Current `task_assignments_internal` is `FOR ALL` using the reader cohort.

Fix:
- SELECT remains available to internal readers;
- INSERT/UPDATE/DELETE require `is_internal_tenant_writer_for_tenant`, excluding viewer/stakeholder;
- INSERT/UPDATE additionally require the referenced `worker_tasks.id` to belong to the same `tenant_id`.

### Sync cursors are tenant-wide writable

Current `sync_cursors_internal` is broad tenant-level `FOR ALL`, so one tenant member can target another user's device cursor. The application repository itself always reads/upserts by `(tenantId, userId, deviceId)`.

Fix:
- SELECT/INSERT/UPDATE/DELETE are all bound to `user_id = auth.uid()` plus tenant membership;
- this matches the existing sync repository contract and blocks cross-user cursor deletion/reset.

## Migration

`20260906114000_harden_aftercare_assignments_sync_cursors.sql`

## Regression coverage

`lib/tenant/service-requests-assignments-sync-rls.hardening.test.ts`

Coverage locks:
- manager-scoped aftercare writes;
- preservation of portal request-create policy;
- narrowly scoped portal initial event;
- writer-only, tenant-consistent task assignment mutation;
- own-row sync cursor access.

## Dependency / validation

Wave 4b is rebuilt from the corrected Wave 3 exact head after the previous validation stack exposed a Wave 3 TypeScript typing failure. The old #287 merge path was closed and is not reused.

Before any merge, the exact resulting stack SHA must be validated by the full CI/release suite against a `main`-based validation context.

## Required gates

- clean Wave 4-only diff against corrected Wave 3;
- exact-head full CI validation before merge;
- no unresolved P0/P1 review findings;
- staging/prod policy-name/schema compatibility before migration apply;
- negative direct-REST checks: viewer cannot mutate aftercare/assignments; one user cannot read/delete another user's sync cursor;
- positive portal aftercare create including initial audit event;
- positive manager aftercare transitions and member task assignment flow per intended role model;
- positive own-device sync ack/read flow;
- no production mutation in this PR.
