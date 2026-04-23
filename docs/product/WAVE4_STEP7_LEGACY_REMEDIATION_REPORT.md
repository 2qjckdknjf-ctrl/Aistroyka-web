# Wave 4 Step 7 — Legacy viewer stakeholder remediation

**Date:** 2026-03-29

## C1 — Representation

- **New** accepts: `tenant_members.role = stakeholder` (see `stakeholders.service` + `20260330150000`).  
- **Legacy**: users with **`role = viewer`** on `tenant_members` who accepted **before** the `stakeholder` role existed.

## C2 — Remediation (automatic)

**Migration `20260330170000_stakeholder_rls_isolation.sql`** runs:

```sql
update public.tenant_members tm
set role = 'stakeholder'
from public.project_stakeholders ps
where ps.user_id = tm.user_id
  and ps.tenant_id = tm.tenant_id
  and ps.status = 'active'
  and tm.role = 'viewer';
```

**Scope:** Only rows where the user is an **active** external stakeholder **and** still marked `viewer`.

## C3 — Operational SQL (optional verification)

```sql
-- Should return 0 after migration in a healthy tenant:
select tm.id, tm.user_id, tm.tenant_id, tm.role
from public.tenant_members tm
join public.project_stakeholders ps
  on ps.user_id = tm.user_id and ps.tenant_id = tm.tenant_id and ps.status = 'active'
where tm.role = 'viewer';
```

## C4 — Accept flow (ongoing)

`acceptStakeholderInvite` already inserts `stakeholder` **or** upgrades `viewer` → `stakeholder` when applicable.

## C5 — Remaining risk

- **P2**: If a user is **`viewer`** for **internal** reasons **and** **also** active stakeholder, they become **`stakeholder`** — **narrower** DB access; **app** APIs must still enforce **internal** routes (already middleware). If product ever needs **both** internal viewer and portal on same account, model would need a separate row or role split — **not** in scope.
