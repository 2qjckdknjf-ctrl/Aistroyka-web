# Wave 4 Step 7 — Isolation backend report

**Date:** 2026-03-29

## B1 — Dependence on `tenant_members.viewer`

`acceptStakeholderInvite` previously inserted `role: "viewer"` for non–tenant-owners. That aligned with internal “read projects” semantics and caused the isolation gap.

## B2 — Minimal correction implemented

1. **Migration** `20260330150000_tenant_members_stakeholder_role.sql`  
   - Extends `tenant_members.role` check with **`stakeholder`**.

2. **Tenant policy** (`lib/tenant/tenant.policy.ts`)  
   - `stakeholder` has `ROLE_ORDER` **0** → `authorize(..., "project:read")` is **false** → **`canReadProjects` false**.

3. **Accept flow** (`lib/domain/stakeholders/stakeholders.service.ts`)  
   - New rows: `role: "stakeholder"`.  
   - If an existing **`viewer`** row is present (legacy), it is **upgraded** to `stakeholder` so the user does not keep internal viewer rights.

4. **Project reads** (`lib/domain/projects/project.service.ts`)  
   - **`listProjects` / `getProject`**: explicit branch for `ctx.role === "stakeholder"` using `listActiveProjectIdsForUser` + `project.repository` (portal listing / metadata).  
   - **`getProjectForInternalWorkspace`**: returns `Insufficient rights` for stakeholders — used by internal API routes that previously called `getProject` only.

5. **Internal API routes** switched from `getProject` to `getProjectForInternalWorkspace` where appropriate; **estimate GET** adds `isPortalOnlyStakeholderRole` guard (direct `getById` path).

6. **Tenant context** (`lib/tenant/tenant.context.ts`, `lib/tenant/tenant-role.server.ts`) resolves `stakeholder` from `tenant_members`.

## B3 — Backward compatibility

- **Managers / internal roles:** unchanged; still `owner | admin | member | viewer`.  
- **Existing stakeholders with `viewer`:** upgraded to `stakeholder` on next successful accept path is **not** triggered if already active — **manual migration** or **one-off SQL** may be needed for users who already accepted with `viewer` and never re-accept. *Operational note:* run an update to set `tenant_members.role = 'stakeholder'` where the user only has stakeholder portal access (or re-invite). *This sprint documents the gap; optional follow-up script.*

## B4 — Risks

- **Multi-tenant users:** `getActiveTenantRoleForUser` uses the first `tenant_members` row (same as existing context). Unusual if one user is both internal viewer and stakeholder in different tenants.  
- **DB RLS** not role-aware for `stakeholder` (see policy report).
