# HOTFIX — Team / Invitations — Final summary

## Root cause

`public.tenant_invitations` was **canonical in code and hand-written SQL scripts** but **absent from the remote database** until the migration DDL was applied. The base migration `20260303000000_base_tenants_projects.sql` only creates `tenants`, `tenant_members`, and `projects`, so PostgREST reported schema cache errors for missing `tenant_invitations`.

## Canonical model

**Keep `tenant_invitations` + `tenant_members`:** pending invites in `tenant_invitations`; on accept, upsert `tenant_members` and delete the invite.

## Exact fix (repo + DB)

1. **Repo:** `apps/web/supabase/migrations/20260326120000_tenant_invitations.sql` defines the table, indexes, RLS, and grants.
2. **Remote Supabase:** Same DDL executed on the linked AISTROYKA project; migration ledger entry `20260326120000` recorded. See [HOTFIX_TEAM_INVITATIONS_SUPABASE_APPLY.md](./HOTFIX_TEAM_INVITATIONS_SUPABASE_APPLY.md).
3. **API/UI:** Error mapping and Team page handling — see file list below.

## Files changed (codebase)

- `apps/web/supabase/migrations/20260326120000_tenant_invitations.sql`
- `apps/web/lib/tenant/invitation-errors.ts`
- `apps/web/lib/tenant/invitation-errors.test.ts`
- `apps/web/app/api/tenant/invite/route.ts`
- `apps/web/app/api/tenant/accept-invite/route.ts`
- `apps/web/app/api/tenant/invitations/route.ts`
- `apps/web/app/api/activation/status/route.ts`
- `apps/web/app/[locale]/(dashboard)/team/page.tsx`
- `apps/web/app/api/tenant/invite/route.test.ts`
- `apps/web/app/api/tenant/accept-invite/route.test.ts`

## DB objects created / verified (remote)

- **Table:** `public.tenant_invitations` with FKs to `tenants` and `auth.users`.
- **Indexes:** unique `token`, unique `(tenant_id, lower(email))`, index on `tenant_id`.
- **RLS:** `tenant_invitations_select`, `tenant_invitations_insert`, `tenant_invitations_delete`.
- **Grants:** `SELECT`, `INSERT`, `DELETE` for `authenticated`.
- **Ledger:** `supabase_migrations.schema_migrations` version `20260326120000`.

## Team invite

**Works** against the linked project: the table and policies exist; create/list paths match the API.

## Accept flow

**Works** per architecture: invitee JWT email must match invitation email; accept upserts `tenant_members` and deletes the invite (unchanged route logic).

## Membership creation

- **Invitations:** accept path creates `tenant_members` as before.
- **Smoke user:** had no tenant; repaired with a dedicated `tenants` row (`plan = 'free'` per `public.plans` FK) plus `tenant_members` `owner` row. See [HOTFIX_SMOKE_MEMBERSHIP_UNBLOCK.md](./HOTFIX_SMOKE_MEMBERSHIP_UNBLOCK.md).

## `ops/metrics`

**200** with password-grant token from `scripts/smoke/pilot_launch.sh` after smoke membership repair. See [HOTFIX_FINAL_VERDICT.md](./HOTFIX_FINAL_VERDICT.md).
