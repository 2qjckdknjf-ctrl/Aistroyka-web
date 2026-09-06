# AISTROYKA Release Hardening — Security Wave 1

Date: 2026-09-06
Base: `main` @ `143930fdc1bccb6d0785c4412e7e19cd593dd50f`
Tracking: #282

## Scope

No product features. This wave addresses only confirmed current-main authorization/RLS blockers found during release hardening.

## Confirmed findings and fixes

### 1. `tenant_members` self-escalation — STILL_REPRODUCIBLE on base

Current main contains `tenant_members_update_self` with `using (user_id = auth.uid())` and `with check (user_id = auth.uid())`, without constraining `role`. An authenticated member can therefore attempt to mutate their own tenant role through direct PostgREST.

Fix: `20260906090000_block_membership_privilege_escalation.sql`:
- binds tenant invitation role to the inserted membership role;
- installs a trigger preventing authenticated tenant role/identity mutation except explicitly authorized invite transitions;
- splits stakeholder policies;
- scopes stakeholder create/delete to `can_manage_project_membership`;
- allows invitees to update only lifecycle columns, not tenant/project/role/token routing fields.

### 2. Change-order manage cohort is tenant-wide — STILL_REPRODUCIBLE on base

Current main `canManageChangeOrders()` ignores `projectId` and delegates to `canManageProjects(ctx)`. Tenant `member` is sufficient for that capability, so a field member is not constrained to manager/owner membership on the target project.

Fix:
- change orders delegate to project-scoped `canManageClientRequests`;
- client-request management first verifies the project belongs to the caller tenant;
- tenant owner/admin or project manager/owner are allowed; ordinary project worker/contractor are denied.

### 3. Project-member / commercial / proof-pack direct writes — STILL_REPRODUCIBLE on base

Sensitive write policies allowed broader internal-reader cohorts or lacked project/tenant consistency checks.

Fix: `20260906091000_harden_project_commercial_writes.sql`:
- blocks authenticated project-member role/identity escalation;
- scopes proof-pack bearer-token reads/writes to project managers/owners;
- requires `can_manage_project_membership` for change-order/commercial mutations;
- requires project/tenant consistency for sensitive inserts/updates;
- preserves portal open-defect creation while keeping internal defect mutation manager-scoped.

Follow-up consistency fix: `20260906105000_project_members_tenant_match.sql` requires `project_belongs_to_tenant(project_id, tenant_id)` for `project_members` inserts.

### 4. Read helper reused as write helper — STILL_REPRODUCIBLE on base

Current main `is_internal_tenant_reader_for_tenant(...)` intentionally includes `viewer`, while a broad set of generic project/worker write policies reuse that helper. This gives `viewer` a direct PostgREST write path even when application APIs intend viewer to be read-only.

Fix: `20260906104000_project_write_authorization_hardening.sql`:
- adds `is_internal_tenant_writer_for_tenant(...)` = tenant owner or membership role `owner/admin/member`;
- explicitly excludes `viewer` and `stakeholder` from generic writes;
- rewires generic write policies for projects, documents, milestones, client requests, handover, issues, risks, governance, worker day/reports/tasks and worker-report media;
- keeps Worker/member write semantics intact while separating the read and write cohorts.

## Regression coverage

- `lib/domain/client-requests/client-requests.policy.test.ts`
- `lib/domain/change-orders/change-orders.policy.test.ts`
- `lib/tenant/membership-privilege-escalation.rls.test.ts`
- `lib/tenant/project-commercial-rls.hardening.test.ts`
- `lib/tenant/tenant-writer-rls.hardening.test.ts`
- `lib/tenant/project-members-tenant-match.rls.test.ts`

## Non-goals / remaining work

- No production migration apply in this PR.
- No merge of historical #209/#210/#212/#213/#216 branches.
- This wave removes `viewer` from generic writes but does **not** yet claim every owner/admin/member write surface is perfectly project-scoped. Remaining historical findings still require current-main classification in #282.
- No #265/#244 feature work.
- No mobile field-flow fixes (#266/#276/#278/#280/#281) are merged in this wave.

## Required before merge

1. CI green on the final branch SHA.
2. Review migration compatibility with current staging/prod schema and actual policy names.
3. Verify tenant invite and stakeholder accept flows are not regressed.
4. Verify viewer cannot mutate generic project/worker tables through direct PostgREST.
5. Verify worker/member cannot manage change orders/commercial/proof-pack paths without project manager/owner membership.
6. Verify tenant owner/admin and project manager/owner retain expected management paths.
7. Prepare explicit migration apply/rollback steps; production apply remains a separate controlled release action.
8. Do not mark the security finding closed in production until migrations are proven applied there.
