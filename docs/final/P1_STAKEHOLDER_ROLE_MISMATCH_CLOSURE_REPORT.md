# P1 Stakeholder Role Mismatch Closure Report

Date: 2026-04-25

## Scope

Closed the third concrete P1 blocker from `PRODUCTION_RUNTIME_TRUTH_AUDIT.md`: `tenant_members.role = stakeholder` existed in migrations and portal policies, but runtime tenant context resolution rejected it before client portal authorization could run.

This was not a client portal feature sprint, auth rewrite, role-system redesign, or schema change.

## Files Inspected

- `apps/web/lib/tenant/tenant.context.ts`
- `apps/web/lib/tenant/tenant.policy.ts`
- `apps/web/lib/tenant/tenant.types.ts`
- `apps/web/lib/tenant/tenant-role.server.ts`
- `apps/web/lib/tenant/stakeholder-dashboard-paths.ts`
- `apps/web/lib/authz/authz.service.ts`
- `apps/web/lib/authz/authz.types.ts`
- `apps/web/app/api/v1/projects/[id]/client-view/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-portal/route.ts`
- `apps/web/lib/domain/client-portal/client-portal.service.ts`
- `apps/web/lib/domain/client-portal/client-portal.policy.ts`
- `apps/web/lib/domain/stakeholders/stakeholders.policy.ts`
- `apps/web/lib/domain/projects/project-access.ts`
- `apps/web/supabase/migrations/20260303000000_base_tenants_projects.sql`
- `apps/web/supabase/migrations/20260306100000_project_members_task_assignments.sql`
- `apps/web/supabase/migrations/20260323000000_project_members_owner_role.sql`
- `apps/web/supabase/migrations/20260329100000_project_client_portal.sql`
- `apps/web/supabase/migrations/20260329120000_project_stakeholders.sql`
- `apps/web/supabase/migrations/20260329130000_tenant_members_stakeholder_role.sql`
- `apps/web/supabase/migrations/20260329140000_stakeholder_rls_isolation.sql`
- existing tests around tenant policy, RLS stakeholder predicate intent, client-view, client-portal, and client-portal service behavior.

## Actual Role Model Found

1. Runtime role union/type is defined in `apps/web/lib/tenant/tenant.types.ts` as `TenantRoleDb = "owner" | "admin" | "member" | "viewer" | "stakeholder"`.
2. DB tenant roles started as `owner`, `admin`, `member`, `viewer` in the base migration and were extended to include `stakeholder` by `20260329130000_tenant_members_stakeholder_role.sql`.
3. Runtime context previously accepted only `owner`, `admin`, `member`, and `viewer` through a local `ROLES` list in `tenant.context.ts`.
4. Internal dashboard authorization is based on `ROLE_ORDER` in `tenant.policy.ts`; `stakeholder` is intentionally absent, so it receives no internal role level.
5. Portal/client-view authorization is project-scoped: `client-view` requires tenant context, then `getClientProjectView`, then `canReadClientPortalView`, which allows project owner or active `project_stakeholders` row when `client_portal_enabled` is true.
6. `stakeholder` is intended as a tenant-level marker for portal-only identity. Actual project access is not tenant-wide; it is scoped by active rows in `project_stakeholders` with `stakeholder_role` values `client_viewer` or `client_decision_maker`.

## Mismatch

Confirmed.

`TenantRoleDb` and DB migrations allowed `stakeholder`, and portal-only policy helpers referenced it. However, `getRoleInTenant` in `tenant.context.ts` rejected `stakeholder` because its local accepted role list omitted the role. A stakeholder tenant member could therefore resolve as absent tenant context and fail `requireTenant(ctx)` before `client-view` reached project-scoped portal authorization.

## Files Changed

- `apps/web/lib/tenant/tenant.context.ts`
  - Added `stakeholder` to the local accepted DB role list.
  - No tenant selection logic, request auth, service-role behavior, or RLS path changed.
- `apps/web/lib/tenant/tenant.context.test.ts`
  - Added regression coverage that a DB stakeholder role becomes present tenant context.
  - Added regression coverage that unknown DB roles still become absent context.
- `apps/web/lib/tenant/tenant.policy.test.ts`
  - Added coverage that stakeholder is portal-only and has no internal dashboard privileges.
- `apps/web/lib/domain/stakeholders/stakeholders.policy.test.ts`
  - Added coverage that stakeholder can read client-view only with portal enabled and active project stakeholder scope.
  - Added coverage that cross-project stakeholder access is denied.
  - Added coverage that stakeholder cannot manage project stakeholders.
- `apps/web/app/api/v1/projects/[id]/client-view/route.test.ts`
  - Added coverage that stakeholder tenant context passes through `requireTenant` to the client-view service.

## Why The Change Is Tenant-Safe

- `stakeholder` is only accepted into `TenantContext`; it is not added to `ROLE_ORDER`.
- `canReadProjects`, `canManageProjects`, admin actions, media reads, project creates, and billing/admin actions remain denied for stakeholder.
- `isPortalOnlyStakeholderRole(ctx)` continues to identify stakeholder as portal-only.
- Client-view access remains project-scoped through `project_stakeholders`, not broad tenant membership.
- Cross-project stakeholder access remains denied when no active `project_stakeholders` row exists.
- Unknown roles are still rejected.
- No service-role access or schema changes were introduced.

## Tests Added / Updated

- `apps/web/lib/tenant/tenant.context.test.ts`
- `apps/web/lib/tenant/tenant.policy.test.ts`
- `apps/web/lib/domain/stakeholders/stakeholders.policy.test.ts`
- `apps/web/app/api/v1/projects/[id]/client-view/route.test.ts`

Focused coverage includes:

- Stakeholder role parsing from tenant_members into runtime tenant context.
- Unknown role rejection.
- Stakeholder portal-only / no internal workspace privileges.
- Client-view stakeholder pass-through after `requireTenant`.
- Stakeholder client-view allow only with portal enabled and active project stakeholder access.
- Cross-project stakeholder denial.
- Stakeholder denial for manager-style stakeholder management.

## Validation Commands

- `git status --short --branch --untracked-files=all`
  - Passed; no unexpected generated artifacts.
- `bun run --cwd apps/web test "lib/tenant/tenant.context.test.ts" "lib/tenant/tenant.policy.test.ts" "lib/domain/stakeholders/stakeholders.policy.test.ts" "app/api/v1/projects/[id]/client-view/route.test.ts" "app/api/v1/projects/[id]/client-portal/route.test.ts"`
  - Passed: 5 files, 19 tests.
- `bun run test`
  - Passed: 233 files, 1292 tests.
- `bun run cf:build`
  - Passed: Next.js build, OpenNext Cloudflare build, and post-build patches completed.
- `bash scripts/release/check-migrations.sh`
  - Passed: 96 migrations.
- `ReadLints`
  - Passed: no linter errors reported for touched files.

## Remaining Risks

- Tests use route/service/policy mocks for targeted behavior. They do not execute a live Supabase project with a real stakeholder JWT and RLS policies.
- Portal data access still depends on the live migration set being applied in the target Supabase environment.
- Broader stakeholder portal routes beyond `client-view` were inspected but not expanded as part of this P1; this closure only fixes the role-context mismatch blocking portal authorization from running.

## Final Verdict

P1 stakeholder role mismatch: CLOSED.

Stakeholder tenant members are now accepted into runtime tenant context, remain portal-only, retain no internal dashboard privileges, and can reach client-view authorization where project-scoped portal rules decide access. Validation is green.
