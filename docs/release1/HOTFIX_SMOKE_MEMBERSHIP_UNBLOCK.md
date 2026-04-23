# HOTFIX — Smoke user tenant membership (`ops/metrics` unblock)

## Smoke configuration (non-secret)

- **Smoke identity** is defined in `apps/web/.env.local` via `SMOKE_EMAIL` / `SMOKE_PASSWORD` (values are **not** documented here).
- **Supabase project** is the same as `NEXT_PUBLIC_SUPABASE_URL` in that file.

## Diagnosis (before fix)

1. **Auth:** User with email `smoke@aistroyka.ai` exists in `auth.users`.
2. **Tenant resolution:** There was **no** `public.tenants` row with `user_id` set to that user, and **no** `public.tenant_members` row for that user.
3. **Effect:** `getTenantContextFromRequest` returned `userId` with `tenantId: null`, so `GET /api/v1/ops/metrics` responded **403** with `User has no tenant membership`.

## Repair (canonical model)

Aligned with first-time web bootstrap (`getOrCreateTenantForCurrentUser`):

1. **Inserted** a `public.tenants` row:
   - `name`: `Smoke (pilot)`
   - `plan`: `free` (must exist in `public.plans`; production uses FK `fk_tenants_plan` — **not** the legacy uppercase enum from older local migrations)
   - `user_id`: smoke user UUID from `auth.users`
2. **Inserted** `public.tenant_members` with `role = 'owner'` for `(tenant_id, user_id)` with `ON CONFLICT` upsert semantics.

This gives the smoke user both **owner via `tenants.user_id`** (resolved first by tenant context) and an explicit **`tenant_members`** row for RLS parity with the rest of the data plane.

## Final DB truth (after fix)

- Smoke user has a **dedicated tenant** (pilot workspace) and **`owner`** membership.
- **Do not** paste UUIDs from production into public tickets without need; verify in Supabase Table Editor: `tenants` + `tenant_members` for `smoke@aistroyka.ai`.

## `ops/metrics`

After the repair, **`GET /api/v1/ops/metrics`** with a Supabase **password-grant** access token (as implemented in `scripts/smoke/pilot_launch.sh`) returns **HTTP 200** against production `BASE_URL` when env is loaded from `.env.local`.
