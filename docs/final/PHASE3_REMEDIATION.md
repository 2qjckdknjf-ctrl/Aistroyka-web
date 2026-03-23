# Phase 3 remediation — production blockers

**Date:** 2026-03-23  
**Tracks:** [AISAA-11](/AISAA/issues/AISAA-11) (repo + runbook); source audit [AISAA-10](/AISAA/issues/AISAA-10).

## Before

- `GET /api/v1/health` could return **503** with Postgres **infinite recursion** on `tenant_members` RLS when the anon client evaluated policies that subqueried `tenant_members` (see `getHealthResponse` → `from("tenants").select("id").limit(1)` and `tenants_select_own_or_member`).
- Remote Supabase could lag repo on `20260323000000_project_members_owner_role.sql` (see [PHASE3_LIVE_POST_AUDIT.md](./PHASE3_LIVE_POST_AUDIT.md)).

## After (repo)

1. **RLS:** New migration `20260323110000_tenant_members_rls_break_recursion.sql` adds `public.current_user_tenant_ids()` (`SECURITY DEFINER`, `search_path = public`) and redefines `tenant_members_select_own` to use it instead of self-querying `tenant_members` under the same policy.
2. **Project membership:** Existing migration `20260323000000_project_members_owner_role.sql` remains the backfill for `owner` on `project_members` (apply in order after prior Phase 3 migrations).

## Ops checklist (staging + production)

Apply via the approved GitHub workflow (or `supabase db push` against the correct project ref), then verify per environment:

1. `supabase migration list` — confirm both `20260323000000_project_members_owner_role` and `20260323110000_tenant_members_rls_break_recursion` are applied (redact connection details in evidence; filenames only is fine).
2. `curl -sS "$BASE_URL/api/v1/health"` — expect **200**, `ok: true`, `db: "ok"` when anon + RLS are consistent.
3. Optional: re-run `scripts/smoke/pilot_launch.sh` with required secrets after deploy.

## Contract note

Health continues to mean: Supabase reachable with **anon** key and a trivial `tenants` read succeeds under RLS. If the product later requires a stricter probe (e.g. service role only), that needs an explicit contract change and board sign-off per [PHASE3_LIVE_POST_AUDIT.md](./PHASE3_LIVE_POST_AUDIT.md).
