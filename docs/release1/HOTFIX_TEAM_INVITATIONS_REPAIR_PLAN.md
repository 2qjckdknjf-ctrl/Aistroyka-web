# HOTFIX — Team / Invitations — Repair plan

## Root cause

Application and docs assumed `public.tenant_invitations` exists; the migration set did not create it, causing PostgREST schema cache errors and broken Team/invite flows.

## Files changed

| File | Change |
|------|--------|
| `apps/web/supabase/migrations/20260326120000_tenant_invitations.sql` | **New** — table, indexes, unique `(tenant_id, lower(email))`, RLS, `authenticated` grants |
| `apps/web/lib/tenant/invitation-errors.ts` | **New** — map missing-table / schema-cache errors to 503 + operator-safe message |
| `apps/web/lib/tenant/invitation-errors.test.ts` | **New** — unit tests for mapper |
| `apps/web/app/api/tenant/invite/route.ts` | Use mapper; avoid leaking raw DB errors on 500 |
| `apps/web/app/api/tenant/accept-invite/route.ts` | Same; sanitize membership/insert failures |
| `apps/web/app/api/tenant/invitations/route.ts` | Handle list errors |
| `apps/web/app/api/activation/status/route.ts` | If invitation count query errors, treat count as 0 (degraded onboarding signal, no crash) |
| `apps/web/app/[locale]/(dashboard)/team/page.tsx` | If invitation list errors, disable team features banner path |
| `apps/web/app/api/tenant/invite/route.test.ts` | **New** — success + 503 mapping |
| `apps/web/app/api/tenant/accept-invite/route.test.ts` | **New** — 503 mapping |

## DB / schema

- **Table:** `tenant_invitations(id, tenant_id, email, role, token, created_by, expires_at, created_at)` matching `scripts/team-migrations.sql` and API usage.
- **RLS:**
  - **SELECT:** tenant members (`current_user_tenant_ids()`), **or** tenant row owner (`tenants.user_id`), **or** JWT email matches invitation email (accept flow before membership).
  - **INSERT:** owner/admin via `tenant_members`, **or** cabinet owner via `tenants.user_id`; `created_by = auth.uid()`.
  - **DELETE:** owner/admin, cabinet owner, **or** invitee email match (cleanup after accept).
- **No** `using (true)` on app data.

## Risk controls

- Did not change `tenant.context.ts` resolution logic, middleware, or lite-allow-list.
- Minimal new surface in `lib/tenant` (error helper only).
- Smoke `ops/metrics` still requires real membership; fixing the table does not invent membership for orphan auth users.

## Why this fixes the contour end-to-end

1. Migration creates the table remote developers and CI apply like any other migration.
2. RLS allows the documented flows: admin/owner creates invite; invitee with matching session email can read/delete through accept; members list works for tenant-scoped reads.
3. APIs no longer expose raw PostgREST “schema cache” strings as the primary UX on failures pre-deploy.

## Deploy note

**Apply** `20260326120000_tenant_invitations.sql` to production Supabase (linked project migration apply or SQL editor in controlled change). Until applied, APIs return **503** with a clear migrations message instead of opaque errors.
