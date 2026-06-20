# Account Stage 2.1 — Foundation Closure

**Date:** 2026-06-20  
**Scope:** Additive accounts + account_members + tenant backfill only.  
**Prerequisite:** RBAC Stage 1 P0 live closed.

---

## Summary

Stage 2.1 introduces the **account dimension** above tenants without changing contractor-led behavior, tenant resolution, routes, UI, or mobile API.

| Deliverable | Status |
|-------------|--------|
| `accounts` table | Added |
| `account_members` table | Added |
| `tenants.account_id` NOT NULL | Enforced after backfill |
| Contractor account backfill | In migration |
| Stakeholder excluded from account_members | Yes |
| RLS on accounts / account_members | Enabled |
| Server helpers | Added under `lib/account/` |
| Tenant context unchanged | Yes |

---

## Migration

**File:** `apps/web/supabase/migrations/20260620142136_stage2_1_accounts_foundation.sql`

### Tables

**`accounts`**

- `account_type`: `platform` \| `contractor` \| `client`
- `display_name` NOT NULL
- `slug` nullable unique (backfill: `t-{tenant_uuid_without_dashes}`)
- `status`: `active` \| `suspended` \| `closed`
- `metadata` jsonb default `{}`

**`account_members`**

- Roles: `owner`, `admin`, `member`, `viewer` (initial set only)
- Status: `active`, `invited`, `removed`
- Unique `(account_id, user_id)`

**`tenants.account_id`**

- FK → `accounts(id)` ON DELETE RESTRICT
- NOT NULL after backfill block

---

## Backfill strategy

1. For each tenant with `account_id IS NULL`:
   - Insert `accounts` row: `account_type='contractor'`, `display_name=coalesce(tenant.name,'Workspace')`, deterministic slug.
   - Set `tenants.account_id`.
2. Insert `account_members` from `tenant_members` where role ∈ `{owner, admin, member, viewer}`.
3. **Exclude** `tenant_members.role='stakeholder'`.
4. Upsert legacy `tenants.user_id` as `account_members.role='owner'`.
5. Abort migration if any tenant lacks `account_id`; then `ALTER COLUMN account_id SET NOT NULL`.

**Idempotency:** `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, slug uniqueness prevents duplicate accounts on re-run.

---

## RLS summary

| Table | Authenticated read | Authenticated write |
|-------|-------------------|---------------------|
| `accounts` | Active `account_members` only | Denied (`using false`) |
| `account_members` | Own active rows only | Denied (`using false`) |

Service role bypasses RLS for server paths. **Tenant RLS unchanged.**

Platform owner routes do not expose account business content — accounts hold identity metadata only.

---

## Server helpers

| Function | Module |
|----------|--------|
| `getAccountByTenantId` | `account.service.ts` |
| `getUserAccounts` | `account.service.ts` |
| `resolveActiveAccount` | `account.service.ts` |
| `assertAccountMember` | `account.service.ts` |
| `isAccountMember` | `account.service.ts` |

**Not in scope:** account switcher UI, `TenantContext` replacement, client onboarding.

---

## Live activation (2026-06-20)

**Target project:** `vthfrxehrursfloevnlp` (AISTROYKA, eu-central-1)

| Step | Result |
|------|--------|
| Repo migration file | YES — `20260620142136_stage2_1_accounts_foundation.sql` |
| Migration SQL safety | PASS — additive DDL + backfill only |
| Local Supabase CLI | **BLOCKED** — Bad CPU type (arch mismatch) |
| Apply path | MCP `apply_migration` on linked project |
| Migration applied | **YES** |
| Remote version / name | `20260620142136` / `stage2_1_accounts_foundation` |

**Migration alignment (2026-06-20):** repo file `20260620142136_stage2_1_accounts_foundation.sql` matches remote `20260620142136` / `stage2_1_accounts_foundation`. No SQL content changed.

### Live DB verification

| Check | Live result |
|-------|-------------|
| `accounts` table exists | YES |
| `account_members` table exists | YES |
| `tenants.account_id` column exists | YES |
| `tenants.account_id` NOT NULL | YES (`is_nullable = NO`) |
| Tenants without `account_id` | **0** (3 tenants) |
| Contractor accounts | **3** (= tenant count) |
| `account_members` rows | **6** (owner: 2, admin: 3, member: 1) |
| Stakeholders backfilled to account_members | **0** |
| Invalid account_member roles | **0** |
| Invalid account_type values | **0** |
| RLS on `accounts` | YES |
| RLS on `account_members` | YES |
| Authenticated write policies | Denied (`accounts_service_all`, `account_members_service_all` → `false`) |

---

## Validation

| Check | Result |
|-------|--------|
| `bun run lint` | PASS (2026-06-20 live activation) |
| `bun run test -- --run` | PASS — 333 files, 1680 tests |
| Targeted `lib/account` tests | PASS — 15 tests |
| `bun run build` | FAIL — Volta could not execute `next build` (exit 126, environment) |

---

## Remaining Stage 2 gaps

| Stage | Item | Severity |
|-------|------|----------|
| 2.2 | Harden account_members backfill verification in live DB | P1 |
| 2.3 | Deprecate `tenants.user_id` in new code paths | P2 |
| 2.4 | `account_subscriptions` + billing `account_id` | P2 |
| 2.5 | Active account cookie / session preference | P1 |
| 2.6 | Client persona → client account + tenant | P1 |
| 2.7 | `project_participants`, `project_links` | P1 |
| 2.8 | `project_mode`, `owner_account_id` | P1 |

---

## Strict verdict

## **STAGE 2.1 LIVE CLOSED**

Application helpers in repo + live DB objects verified on project `vthfrxehrursfloevnlp`.

**Caveats (not Stage 2.1 blockers):**

- Repo migration filename matches remote history (reconciled 2026-06-20).
- New tenant creation paths do not yet auto-create accounts (Stage 2.2+ app layer).
- Account switcher deferred to Stage 2.5.

---

## Next step

Stage 2.2 — app-layer account creation on new tenant signup + optional `accounts.primary_tenant_id` per `ACCOUNT_IMPLEMENTATION_PLAN.md`.
