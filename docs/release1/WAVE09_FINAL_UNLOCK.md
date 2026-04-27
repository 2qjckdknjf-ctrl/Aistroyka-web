# Wave 0.9 — Final Wave 1 unlock (post–hotfix verification)

**Date:** 2026-03-27 (UTC)  
**Mode:** Verification and formal unlock only — **no** product implementation.

## Preconditions

Prior hotfix completed: `public.tenant_invitations` DDL on linked Supabase, smoke user tenant membership, pilot smoke green. See `HOTFIX_*` docs under `docs/release1/`.

## Verification (this pass)

### 1. `tenant_invitations` on linked Supabase

- **Query:** `to_regclass('public.tenant_invitations')` → `tenant_invitations`, not null.
- **RLS:** `pg_policies` count for `public.tenant_invitations` = **3** (select / insert / delete policies).

### 2. Team invite contour vs missing table

- **Root cause of prior failure** was absence of `tenant_invitations` in the remote DB.
- **Current state:** table exists with expected policies; PostgREST can resolve the relation (no “missing table / schema cache” class error for this object).

### 3. Authoritative smoke (`scripts/smoke/pilot_launch.sh`)

Environment: `set -a && . apps/web/.env.local && set +a`, `BASE_URL` from `NEXT_PUBLIC_APP_URL` (production).

| Step | Result |
|------|--------|
| `GET /api/v1/health` | **HTTP 200**, body `ok: true` (separate curl check) |
| `GET /api/v1/config` | **PASS** (script) |
| `POST /api/v1/admin/jobs/cron-tick` | **PASS** (script) |
| `GET /api/v1/ops/metrics` | **PASS** (script) |

**Script exit code:** `0`.

### 4. Smoke user tenant membership

- **Auth:** `smoke@aistroyka.ai` present in `auth.users`.
- **Tenant:** `public.tenants` row `Smoke (pilot)` with `user_id` = smoke user (cabinet owner).
- **Membership:** `public.tenant_members` row with **`role = owner`** for that user and tenant.

## Formal binary decision

**WAVE1_APPROVED**

All success criteria for this unlock pass are met: invite contour unblocked at DB level, smoke fully green, smoke user has valid tenant context for `ops/metrics`.
