# AISTROYKA Release Hardening — Security Wave 1

Date: 2026-09-06
Base: `main` @ `143930fdc1bccb6d0785c4412e7e19cd593dd50f`
Tracking: #282

## Scope

No product features. This wave addresses only confirmed current-main authorization/RLS blockers found during release hardening.

## Confirmed findings

### 1. tenant_members self-escalation — STILL_REPRODUCIBLE

Current main contains `tenant_members_update_self` with `using (user_id = auth.uid())` and `with check (user_id = auth.uid())`, without constraining `role`. An authenticated member can therefore attempt to mutate their own tenant role through direct PostgREST.

Fix: `20260906090000_block_membership_privilege_escalation.sql` binds invitation roles, installs a role-change trigger, and protects privileged `project_stakeholders` columns.

### 2. change-order manage cohort is tenant-wide — STILL_REPRODUCIBLE

Current main `canManageChangeOrders()` ignores `projectId` and delegates to `canManageProjects(ctx)`. Tenant `member` is sufficient for that capability, so a field member is not constrained to manager/owner membership on the target project.

Fix: change orders delegate to project-scoped `canManageClientRequests`; client-request management now verifies project ownership by tenant and permits only tenant owner/admin or project manager/owner.

### 3. direct commercial/proof/project-member RLS writes — STILL_REPRODUCIBLE

Current main has write policies that rely on `is_internal_tenant_reader_for_tenant`; that read helper includes viewer/member roles. Existing `can_manage_project_membership(tenant_id, project_id)` is the correct project-manage cohort.

Fix: `20260906091000_harden_project_commercial_writes.sql` hardens project membership role changes, proof-pack bearer-token access, change-order/commercial writes, cross-tenant project/tenant consistency, and defect mutation paths.

## Regression coverage

- `lib/domain/client-requests/client-requests.policy.test.ts`
- `lib/domain/change-orders/change-orders.policy.test.ts`
- `lib/tenant/membership-privilege-escalation.rls.test.ts`
- `lib/tenant/project-commercial-rls.hardening.test.ts`

## Non-goals / deferred

- No production migration apply in this PR.
- No merge of historical #209/#210 branches.
- No broad RLS rewrite yet for every table identified under #212/#213/#216; those remain tracked in #282 and must be classified/fixed in subsequent hardening waves.
- No #265/#244 feature work.

## Required before merge

1. CI green on this branch.
2. Review migration compatibility with current staging/prod schema and policy names.
3. Verify invite accept and stakeholder accept flows are not regressed.
4. Verify worker/member cannot manage change orders via API or direct PostgREST.
5. Verify tenant owner/admin and project manager/owner retain expected management paths.
6. Prepare explicit migration apply/rollback steps; production apply remains a separate owner-controlled release action.
