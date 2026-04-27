# HOTFIX — Team / Invitations / Tenant Membership — Phase A audit

**Date:** 2026-03-24  
**Scope:** Team page, invite/accept APIs, `tenant_invitations`, `tenant_members`, smoke `ops/metrics` membership.

## Canonical truth

**`tenant_invitations` is canonical** for the product contour:

- `POST /api/tenant/invite` inserts into `tenant_invitations` and returns an accept link.
- `POST /api/tenant/accept-invite` reads by `token`, upserts `tenant_members`, deletes the invitation row.
- `GET /api/tenant/invitations` lists pending invites for admins.
- Dashboard **Team** page (`app/[locale]/(dashboard)/team/page.tsx`) lists members and pending invitations.
- `GET /api/activation/status` counts invitations for onboarding “invite team”.

**Legacy / hand-run SQL** (`apps/web/scripts/team-migrations.sql`, `supabase-migrations-bundle.sql`) defined `tenant_invitations`, but **the formal migration chain under `apps/web/supabase/migrations/` never created it.**

The base migration `20260303000000_base_tenants_projects.sql` creates only:

- `public.tenants`
- `public.tenant_members`
- `public.projects`

**Conclusion (A vs B):** **Truth A** — `tenant_invitations` is canonical and was **missing from deployed schema** because no migration in the repo’s migration folder created it. The Team page was not “stale”; the database was incomplete relative to the application contract.

## Code references — `tenant_invitations`

| Location | Role |
|----------|------|
| `apps/web/app/api/tenant/invite/route.ts` | Insert invite, audit |
| `apps/web/app/api/tenant/accept-invite/route.ts` | Select by token, upsert `tenant_members`, delete invite |
| `apps/web/app/api/tenant/invitations/route.ts` | List pending invites |
| `apps/web/app/[locale]/(dashboard)/team/page.tsx` | Server-side list for UI |
| `apps/web/app/api/activation/status/route.ts` | Head count for onboarding |
| `apps/web/lib/platform/plan-fit/orchestration/setup-readiness.evaluator.ts` | Readiness probe |

## Code references — `tenant_members`

Core resolution: `apps/web/lib/tenant/tenant.context.ts` (`getActiveTenantId`, `getRoleInTenant`), `apps/web/lib/api/engine.ts` (`getOrCreateTenantForCurrentUser` creates tenant + owner row), RLS helpers `public.current_user_tenant_ids()` in `20260323110000_tenant_members_rls_break_recursion.sql`.

## Observed failures — root cause

1. **PostgREST “schema cache” / missing table:** Queries to `tenant_invitations` failed because the relation did not exist in Postgres after migrations were applied.
2. **`GET /api/v1/ops/metrics` → 403 “User has no tenant membership”:** This is **orthogonal** to the missing table. It occurs when `getTenantContextFromRequest` finds a user id but no `tenants.user_id` match and no `tenant_members` row (`tenant.context.ts`). A smoke user must either use the normal tenant bootstrap (`getOrCreateTenantForCurrentUser`) or **accept an invitation** so `tenant_members` is populated.

## Decision

- **Restore `tenant_invitations` via a first-class migration** with RLS aligned to owner/admin invite, tenant listing, and invitee email match for accept flow.
- **Do not** remove the Team UI or replace with a different model; align DB to the existing architecture.

## Migrations reviewed

- `20260303000000_base_tenants_projects.sql` — tenants / tenant_members / projects only.
- `20260323110000_tenant_members_rls_break_recursion.sql` — `current_user_tenant_ids()` (required for invitation RLS).
- **New:** `20260326120000_tenant_invitations.sql` — creates `tenant_invitations` + policies + grants.
