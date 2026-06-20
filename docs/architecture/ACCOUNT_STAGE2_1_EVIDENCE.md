# Account Stage 2.1 — Implementation Evidence

**Date:** 2026-06-20

---

## Migration summary

**File:** `apps/web/supabase/migrations/20260620142136_stage2_1_accounts_foundation.sql`

**Operations:**

- `CREATE TABLE accounts`
- `CREATE TABLE account_members`
- `ALTER TABLE tenants ADD COLUMN account_id`
- Backfill contractor accounts (1:1 per tenant)
- Backfill account_members (non-stakeholder tenant_members + legacy tenant.user_id)
- `ALTER TABLE tenants ALTER COLUMN account_id SET NOT NULL`
- Indexes + updated_at triggers
- RLS policies (read-only for authenticated)

---

## Backfill behavior (explicit)

| Source | Target | Rule |
|--------|--------|------|
| `tenants` (no account_id) | `accounts` | `account_type='contractor'` |
| `tenant_members.owner/admin/member/viewer` | `account_members` | Same role |
| `tenant_members.stakeholder` | — | **Skipped** |
| `tenants.user_id` | `account_members.owner` | Upsert owner |

---

## RLS policies

```sql
accounts_select_member      -- SELECT where user is active account_member
accounts_service_all        -- ALL denied for authenticated
account_members_select_own  -- SELECT own active rows
account_members_service_all -- ALL denied for authenticated
```

---

## Files changed

| File | Action |
|------|--------|
| `apps/web/supabase/migrations/20260620142136_stage2_1_accounts_foundation.sql` | Added |
| `apps/web/lib/account/account.types.ts` | Added |
| `apps/web/lib/account/account.guard.ts` | Added |
| `apps/web/lib/account/account.repository.ts` | Added |
| `apps/web/lib/account/account.service.ts` | Added |
| `apps/web/lib/account/account.service.test.ts` | Added |
| `apps/web/lib/account/account-backfill-intent.test.ts` | Added |
| `docs/architecture/ACCOUNT_STAGE2_1_FOUNDATION.md` | Added |
| `docs/architecture/ACCOUNT_STAGE2_1_EVIDENCE.md` | Added |

**Not modified:** `tenant.context.ts`, middleware, routes, UI, mobile API, `tenant_members`, `project_members`, `project_stakeholders`.

---

## Tests added

| File | Tests | Coverage |
|------|-------|----------|
| `account-backfill-intent.test.ts` | 6 | Stakeholder exclusion, slug pattern, tenant mapping intent |
| `account.service.test.ts` | 9 | getAccountByTenantId, resolveActiveAccount priority, assertAccountMember, getUserAccounts, tenant context unchanged |

---

## Live activation evidence (2026-06-20)

| Item | Evidence |
|------|----------|
| Project | `vthfrxehrursfloevnlp` |
| Migration applied | **YES** |
| Remote version / name | `20260620142136` / `stage2_1_accounts_foundation` |
| Repo file | `20260620142136_stage2_1_accounts_foundation.sql` |
| Apply path | MCP `apply_migration` (CLI unavailable) |
| Prior migration tail | `20260620140442_rbac_stage1_security_hardening` |

### Live counts (verified)

| Metric | Value |
|--------|-------|
| Tenants | 3 |
| Tenants without account_id | 0 |
| Accounts (contractor) | 3 |
| account_members | 6 (owner: 2, admin: 3, member: 1, viewer: 0) |
| Stakeholder → account_member leaks | 0 |

### Live RLS policies

- `accounts_select_member` (SELECT)
- `accounts_service_all` (ALL → false)
- `account_members_select_own` (SELECT)
- `account_members_service_all` (ALL → false)

---

## Validation results (2026-06-20 live activation)

```
bun run lint          → PASS
bun run test -- --run → PASS (333 files, 1680 tests)
lib/account tests     → PASS (15 tests)
bun run build         → FAIL (Volta/next exit 126 — environment)
```

---

## resolveActiveAccount priority (matches tenant resolution)

1. `preferredAccountId` if valid membership
2. Account linked to `tenants.user_id` (owned tenant)
3. First active `account_members` row

This preserves single-workspace contractor behavior when one account exists.

---

## Live apply checklist (ops)

After `supabase db push` or MCP apply:

```sql
-- All tenants linked
select count(*) from tenants where account_id is null;  -- expect 0

-- Stakeholders not account members
select count(*)
from tenant_members tm
join tenants t on t.id = tm.tenant_id
left join account_members am on am.account_id = t.account_id and am.user_id = tm.user_id
where tm.role = 'stakeholder' and am.user_id is not null;  -- expect 0

-- One contractor account per tenant
select count(*) from accounts where account_type = 'contractor';
select count(*) from tenants;
-- counts should match
```

---

## Remaining risks

1. **Local Supabase CLI broken** — dry-run/push from workstation blocked until CLI arch fixed.
2. **New tenant creation paths** do not yet auto-create accounts — addressed in Stage 2.2 (live closed).
3. **Multi-account users** still resolve first membership — switcher deferred to Stage 2.5.

---

## Migration timestamp reconciliation (2026-06-20)

| Item | Value |
|------|-------|
| Remote version | `20260620142136` / `stage2_1_accounts_foundation` |
| Repo file (aligned) | `apps/web/supabase/migrations/20260620142136_stage2_1_accounts_foundation.sql` |
| SQL content changed | **NO** — filename-only rename from prior working copy `20260620170000_*` |
| Prior migration tail | `20260620140442_rbac_stage1_security_hardening` (also reconciled) |

Repo filenames now match remote Supabase migration history; future CLI `db push` re-apply risk reduced.

---

## Verdict

**STAGE 2.1 LIVE CLOSED** — repo implementation + live DB verification on `vthfrxehrursfloevnlp`.
