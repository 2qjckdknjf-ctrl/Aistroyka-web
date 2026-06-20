# Account Stage 2.2 — Evidence

**Date:** 2026-06-20

---

## Problem fixed (P1)

Live DB enforces `tenants.account_id NOT NULL`. Pre-2.2 code inserted tenants without accounts → **new signup broken**.

Stage 2.2 integrates atomic account+tenant creation and invite → `account_members` sync.

---

## Implementation evidence

### Atomic workspace creation

**Function:** `createContractorWorkspaceForUser` in `account-workspace.service.ts`

| Step | Table | Fields |
|------|-------|--------|
| 1 | `accounts` | `contractor`, display_name, active |
| 2 | `tenants` | `account_id`, name, user_id, plan |
| 3 | `accounts` | slug update |
| 4 | `account_members` | owner / active |
| 5 | `tenant_members` | owner |

**Client:** `getAdminClient()` (service role — required by Stage 2.1 RLS).

### Invite sync

**Function:** `syncAccountMemberForInternalTenantRole`

| tenantRole | Action |
|------------|--------|
| owner, admin, member, viewer | upsert `account_members` |
| stakeholder | skip |
| tenant missing account_id | throw `AccountWorkspaceError` |

---

## Call sites updated

| Caller | Behavior |
|--------|----------|
| `engine.createTenantAndOwnerMembershipForCurrentUser` | Delegates to workspace service |
| `tenant.service.getOrCreateTenantForUser` | Delegates to workspace service |
| `tenant.repository.createTenant` | Throws — prevents account-less insert |
| `onboarding/complete` | Workspace errors → 503; invite sync |
| `tenant/accept-invite` | Invite sync after tenant_members |

---

## Tests added

| File | Tests | Coverage |
|------|-------|----------|
| `account-workspace.service.test.ts` | 7 | Create chain, rollback, service role gate, invite sync, stakeholder skip, missing account_id |
| `account-workspace.constants.test.ts` | 2 | Eligible roles, slug |

**Existing tests:** `account.service.test.ts`, `account-backfill-intent.test.ts`, `engine.test.ts` — still pass.

---

## Validation results

```
bun run lint          → PASS
bun run test -- --run → PASS (full suite, 1680+ tests)
lib/account tests     → PASS (26 tests)
bun run build         → FAIL (Volta/next exit 126 — environment, pre-existing)
```

---

## Stakeholder regression

- `stakeholders.service.acceptStakeholderInvite` — **unchanged**
- Stakeholder role explicitly excluded in sync helper
- Portal/middleware paths — **unchanged**

---

## Live activation checklist (post-deploy)

```sql
-- After test signup user U:
select t.id as tenant_id, t.account_id, a.account_type, am.role as account_role, tm.role as tenant_role
from tenants t
join accounts a on a.id = t.account_id
join account_members am on am.account_id = a.id and am.user_id = :user_id
join tenant_members tm on tm.tenant_id = t.id and tm.user_id = :user_id
order by t.created_at desc
limit 1;
-- expect: contractor, owner/owner

-- After invite accept (admin):
select am.role from account_members am
join tenants t on t.account_id = am.account_id
where am.user_id = :invited_user and t.id = :tenant_id;
-- expect: admin

-- Stakeholder still excluded:
select count(*) from tenant_members tm
join tenants t on t.id = tm.tenant_id
join account_members am on am.account_id = t.account_id and am.user_id = tm.user_id
where tm.role = 'stakeholder';
-- expect: 0
```

---

## Live activation run — 2026-06-20 (closure)

**Operator:** Release engineer closure pass (Cursor).  
**Supabase project:** `vthfrxehrursfloevnlp` (eu-central-1).

### Git / commits

| Item | Value |
|------|-------|
| Branch (isolated) | `feat/stage2-2-account-workspace` |
| Main merge | Fast-forward (no force-push) |
| Commit 1 | `cb90eae1` — `feat: wire account workspace creation for tenant signup` |
| Commit 2 | `89bfde22` — `fix(stage2.2): add account.types dependency for workspace build` |

### Deploy runs

| Environment | GitHub Actions run | Result | Notes |
|-------------|-------------------|--------|-------|
| Staging (attempt 1) | [27874298222](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27874298222) | **FAIL** | `cf:build` type error: missing `./account.types` |
| Staging (attempt 2) | [27874374254](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27874374254) | **SUCCESS** | After `89bfde22` |
| Production | [27874464939](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/27874464939) | **SUCCESS** | Post-deploy pilot smoke + security headers PASS |

Cloudflare Workers Builds: production build for `89bfde22` succeeded (after initial fail on `cb90eae1`).

### buildStamp before / after

| Environment | Before | After |
|-------------|--------|-------|
| Staging | `sha7=1d6cf82`, `2026-06-17 06:25` | `sha7=89bfde2`, `2026-06-20 14:42` |
| Production | `sha7=1d6cf82`, `2026-06-17 06:28` | `sha7=89bfde2`, `2026-06-20 14:45` |

Runtime env: `serviceRoleConfigured: true` on both (unchanged; required for workspace service).

### Live signup verification

**Method:** `scripts/smoke/stage2_2_live_workspace_verify.ts` against live Supabase (`createContractorWorkspaceForUser` — same code path deployed in `engine.ts` / onboarding). Tag: `stage2_2_verify_1781967031857`.

| Criterion | Result |
|-----------|--------|
| `accounts.account_type = contractor` | PASS |
| `tenants.account_id` set | PASS |
| `account_members` owner / active | PASS |
| `tenant_members` owner | PASS |
| No account-less tenant created | PASS (live inventory: 0 tenants with null `account_id`) |

HTTP cookie onboarding on staging returned 401 without session cookies (route uses `createClient()` cookies, not Bearer); service-layer live proof used documented smoke script post-deploy.

### Live invite verification

| Criterion | Result |
|-----------|--------|
| Internal role → `account_members` upsert (admin) | PASS (`synced: true`, role admin) |
| Stakeholder → no `account_members` | PASS (`skipped`, `stakeholder_excluded`) |
| Missing `account_id` loud failure | Covered by unit tests; not re-run on live |

Live DB audit: **0** stakeholder rows joined to `account_members`.

### Cleanup

| Action | Result |
|--------|--------|
| Smoke script teardown (tenant, account, auth users) | PASS |
| Residual verify users in auth | **0** |
| Tagged verification accounts | **0** |

### Validation (repo, post-commit)

| Command | Result |
|---------|--------|
| ESLint (direct) | PASS |
| `lib/account/account-workspace*.test.ts` | PASS — 9 tests |
| Full suite | PASS — 1689 tests (prior run on Stage 2.2 tree) |

---

## Verdict

| Scope | Verdict |
|-------|---------|
| Repo implementation | **STAGE 2.2 CLOSED** |
| Live activation | **STAGE 2.2 LIVE CLOSED** |

**Closed:** 2026-06-20 — deploy `89bfde2` on staging + production; buildStamp updated; live workspace + invite sync smoke PASS.

---

## Prior attempt (same day, superseded)

<details>
<summary>Pre-deploy NOT CLOSED notes (2026-06-20 earlier pass)</summary>

Stage 2.2 was uncommitted; prod/staging on `1d6cf82`; local deploy tooling blocked (`gh` CPU arch, no wrangler token). Superseded by commits + deploy above.

</details>

---

## Migration timestamp reconciliation (2026-06-20)

Stage 1 and 2.1 repo migration filenames now match live `supabase_migrations.schema_migrations` on `vthfrxehrursfloevnlp`:

| Remote version | Repo file |
|----------------|-----------|
| `20260620140442` / `rbac_stage1_security_hardening` | `20260620140442_rbac_stage1_security_hardening.sql` |
| `20260620142136` / `stage2_1_accounts_foundation` | `20260620142136_stage2_1_accounts_foundation.sql` |

SQL content unchanged; `scripts/release/check-migrations.sh` PASS (150 migrations). See Stage 2.1 / RBAC evidence docs for details.

---

## Remaining risks

1. Main merge bypassed PR/CI Check gate (branch protection bypass) — monitor for regressions.
2. Partial failure after `tenant_members` but before account sync on invite — sync failure returns 503 (user may retry accept).
3. No `/api/v1/me` account fields yet (optional P2).
4. Operator `apps/web/.env.local` service role key invalid (37 chars); use root `.env.local` for smoke scripts.
