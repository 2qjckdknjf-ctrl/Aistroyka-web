# Wave 4 Step 7 — Production verification (final) report

**Date:** 2026-03-29

## F1 — Migration history proof

**FULL** for **AISTROYKA** (`vthfrxehrursfloevnlp`): `supabase migration list` shows **`20260329140000`–`20260329160000`** applied on remote.

## F2 — Legacy remediation SQL (operator dashboard)

Run in Supabase SQL editor (privileged):

```sql
select count(*) as viewer_stakeholder_rows
from public.tenant_members tm
join public.project_stakeholders ps
  on ps.user_id = tm.user_id and ps.tenant_id = tm.tenant_id and ps.status = 'active'
where tm.role = 'viewer';
```

**Expected:** `0` after `20260329140000` remediation `UPDATE`.

**Status:** **PARTIAL** — not executed in this CLI session (no direct SQL session without Dashboard).

## F3 — Functions / policies (operator dashboard)

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

**Status:** **PARTIAL** — not executed here.

## F4 — Live portal / app smoke

**Not run** — requires production URL and test accounts; **not** in scope for CLI-only verification.

## F5 — HiProject

**OPEN** — project paused; **no** verification.
