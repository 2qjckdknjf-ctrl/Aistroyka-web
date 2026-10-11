# Staging verify — `create_analysis_job` request_key RPC

Migration file: `apps/web/supabase/migrations/20261004180000_create_analysis_job_request_key.sql`.

**Do not apply from this document.** Apply only with an explicit OWNER_GATE, staging first, then production. This page is the post-apply / pre-apply observation contract.

## Current apply receipt — 2026-10-11

The existing live AISTROYKA RPC was applied after explicit authorization and isolated SQL/REST/concurrency verification. Remote version `20261011090351`, name `create_analysis_job_request_key_atomic_20261011`, maps to the source file above. The live identity is four arguments with defaulted `p_request_key`; the obsolete three-argument overload is absent. EXECUTE is denied to anon/authenticated and granted to service_role. Service REST accepted the keyed signature and rejected nonexistent tenant/media with `P0002`, creating no live analysis job.

Use [verified receipts/guard](VERIFIED_DB_MIGRATION_RECEIPTS.md) before any proposed apply; missing original file timestamps do not mean this SQL is pending. Staging and production web share this live project. Native isolated PostgreSQL 17.10/PostgREST 14.5 proved three 40-request retry/race scenarios before live application. [Operational report](../reports/2026-10-11-operational-closure.md) contains evidence and remaining full-job-flow limitations.

Sections below preserve the historical before/after verification contract. They do not revoke the completed owner's authorization or require another apply.

## 1. Pre-apply observation (already true on live 2026-10-05)

```sql
select pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_analysis_job';
-- expect before apply: p_tenant_id uuid, p_media_id uuid, p_priority text

select exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'analysis_jobs' and column_name = 'request_key'
) as request_key_present;

select grantee, privilege_type
from information_schema.role_routine_grants
where routine_schema = 'public' and routine_name = 'create_analysis_job';
-- expect EXECUTE only for postgres + service_role (not anon/authenticated)
```

## 2. After staging apply (OWNER_GATE)

```sql
select pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_analysis_job';
-- expect: p_tenant_id uuid, p_media_id uuid, p_priority text, p_request_key text
-- 3-arg identity must be absent (trailing default on the 4-arg function covers legacy calls)
```

Then, using **synthetic** tenant/media only (never real pilot PII):

1. Unkeyed service_role call still creates/reuses an active job (compat with current app omitting `p_request_key`).
2. Keyed call inserts `request_key` on the returned row.
3. Repeat same key + same media returns the same job id.
4. Same key + other media raises `23505`.
5. Concurrent same-key retries do not return a null job.
6. `anon` / `authenticated` EXECUTE denied (negative).
7. Cross-tenant media id fails closed.

App deploy of #385 may land before this apply. `906c9ef7` omits `p_request_key` when unset so live 3-arg RPC keeps resolving until this function exists.

## 3. Production

Promote only after staging checks pass on the same immutable SHA. Do not apply production first.
