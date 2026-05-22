# Stakeholder Smoke Account Setup Report

Date: 2026-05-22  
Project: AISTROYKA  
Environment: Production (`https://aistroyka.ai`)

## Mission result

Status: **PASS**

Dedicated stakeholder smoke account is prepared, linked, verified, and used by the final council gate without weakening role validation.

## 1) Membership schema inspection (actual tables)

Verified in `public` schema:

- `tenant_members` (`tenant_id`, `user_id`, `role`, ...)
- `project_members` (`tenant_id`, `project_id`, `user_id`, `role`, ...)
- `organization_members` (`organization_id`, `user_id`, `org_role`)
- `project_stakeholders` (`tenant_id`, `project_id`, `email`, `stakeholder_role`, `status`, `user_id`, ...)
- `tenant_invitations` (`tenant_id`, `email`, `role`, ...)

Customer/stakeholder project mapping for portal access is handled by **`project_stakeholders`** (`status='active'`, `user_id` bound), not by a separate finance-only mapping table.

## 2) `/api/v1/me` role calculation path

Code path traced:

1. `apps/web/app/api/v1/me/route.ts`
   - Calls `getTenantContextFromRequest(request)`.
   - Returns `data.role` from resolved tenant context.
2. `apps/web/lib/tenant/tenant.context.ts`
   - `getActiveTenantId(...)`:
     - If user owns a tenant (`tenants.user_id = userId`) -> active tenant.
     - Else first `tenant_members` row (`tenant_id`).
   - `getRoleInTenant(...)`:
     - If active tenant owner -> `owner`.
     - Else reads `tenant_members.role` in active tenant.
   - Accepted roles include `stakeholder`.

Important: stakeholder sanity script correctly enforces `role === "stakeholder"` and fails for `admin`/`owner`/empty role.

## 3) Dedicated smoke user created/prepared

- Email: `stakeholder.smoke.1779430231@aistroyka-smoke.local`
- User ID: `62d05b4f-4a2f-4383-9eee-150b181daec5`
- Password: generated and stored securely during setup (not printed in logs/report).

## 4) Tenant/project linkage and role binding

Linked as stakeholder in tenant/project:

- Tenant ID: `6414f756-aa54-48f5-91e2-f852a7c1e837`
- Project ID: `a0000003-0000-4000-8000-000000000001`
- Project name: `STAGE4 Pilot Project`
- `tenant_members.role`: `stakeholder`
- `project_stakeholders.status`: `active`
- `project_stakeholders.stakeholder_role`: `client_decision_maker`
- `projects.client_portal_enabled`: `true` (for target project)

No admin users were changed.

## 5) Verification results

### Auth + role

- Login check: `POST /api/auth/login` -> `200`
- `/api/v1/me` observed:
  - `role = stakeholder`
  - `user_id = 62d05b4f-4a2f-4383-9eee-150b181daec5`
  - `tenant_id = 6414f756-aa54-48f5-91e2-f852a7c1e837`

### Stakeholder finance sanity script

- Command: `scripts/verify/stakeholder_finance_sanity.sh`
- Result: **PASS**
  - costs endpoints denied (`403`)
  - portal payload key denylist check passed

### Final council gate

- Workflow: `Release GO/NO-GO Council`
- Run: `26271634288`
- Result: **PASS**
- `Run stakeholder finance sanity`: **PASS**

## 6) GitHub secrets updated

Updated repository secrets (without exposing values):

- `STAKEHOLDER_SMOKE_EMAIL`
- `STAKEHOLDER_SMOKE_PASSWORD`

These now point to the dedicated stakeholder smoke account above (admin account no longer used for this gate).

## 7) Operator fallback steps (only if reconfiguration is needed later)

If this account must be rotated:

1. Create a new auth user (do not reuse admin/owner accounts).
2. Ensure `tenant_members.role = 'stakeholder'` in target tenant.
3. Ensure `project_stakeholders` has an `active` row for target project with `user_id` bound.
4. Ensure target project has `client_portal_enabled = true`.
5. Update `STAKEHOLDER_SMOKE_EMAIL` and `STAKEHOLDER_SMOKE_PASSWORD` in GitHub secrets.
6. Re-run `release-go-no-go-council.yml` with `run_stakeholder_sanity=true` and confirm pass.
