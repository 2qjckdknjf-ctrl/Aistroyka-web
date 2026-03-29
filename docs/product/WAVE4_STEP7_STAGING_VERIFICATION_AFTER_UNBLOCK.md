# Wave 4 Step 7 — Staging verification (after unblock)

**Date:** 2026-03-29

## F1 — Migration history proof

`supabase migration list` (linked project): **no** pending Step 7 files; **`20260329140000`–`20260329160000`** recorded on remote.

## F2 — Legacy remediation SQL (operator-run in SQL editor)

Run as privileged user in **staging** Supabase SQL editor:

```sql
select count(*) as viewer_stakeholder_rows
from public.tenant_members tm
join public.project_stakeholders ps
  on ps.user_id = tm.user_id and ps.tenant_id = tm.tenant_id and ps.status = 'active'
where tm.role = 'viewer';
```

**Expected after `20260329140000`:** `0` (migration includes `update … set role = 'stakeholder'` for that join).

**Not executed in CLI** this session (no `psql` / Docker-backed `db dump` without Docker).

## F3 — RLS / function proof (operator-run)

```sql
select proname from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'is_internal_tenant_reader_for_tenant',
    'is_portal_stakeholder_for_project',
    'is_portal_stakeholder_for_document'
  );
```

**Expected:** 3 rows.

```sql
select polname from pg_policy
where polrelid = 'public.projects'::regclass
  and polname in ('projects_select_portal', 'projects_write_internal');
```

**Expected:** 2 rows (or verify policy names match migration).

## F4 — Live app/API

**Not run** in this session (no staging URL + bearer tokens in scope).

## F5 — Blocker

**None** for “migrations applied and recorded.” **PARTIAL** for “live SQL verification” and “portal smoke” — operator completes F2–F4 in dashboard.
