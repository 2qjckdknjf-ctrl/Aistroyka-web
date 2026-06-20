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

## Live activation run — 2026-06-20

**Operator:** Release engineer closure pass (Cursor).  
**Supabase project:** `vthfrxehrursfloevnlp` (eu-central-1).

### 1. Repo / deploy readiness

| Check | Result |
|-------|--------|
| Stage 2.2 implementation files present locally | YES — `apps/web/lib/account/account-workspace.service.ts` and call sites |
| Stage 2.2 committed on `origin/main` | **NO** — `origin/main` = `1d6cf825` (2026-06-17); workspace service **not on main** |
| Working branch | `feature/unified-product-design-certification` @ `38e0d705` (Stage 2.2 + related changes **uncommitted**) |
| Secrets in git | No service role key committed (`.env.local` gitignored) |
| Runtime requires `SUPABASE_SERVICE_ROLE_KEY` | YES — `createContractorWorkspaceForUser` uses `getAdminClient()` |

### 2. Runtime env verification (no secret values printed)

| Environment | URL | `serviceRoleConfigured` | `buildStamp.sha7` |
|-------------|-----|-------------------------|-------------------|
| Production | `https://aistroyka.ai/api/v1/health` | **true** | `1d6cf82` (2026-06-17) |
| Staging | `https://staging.aistroyka.ai/api/v1/health` | **true** | `1d6cf82` (2026-06-17) |

**Conclusion:** Worker runtime **has** service role configured. Deployed app code is **pre–Stage 2.2** (health stamp predates workspace service).

Local operator shell: `SUPABASE_SERVICE_ROLE_KEY` in `apps/web/.env.local` is **invalid** (36-char placeholder → Supabase `Invalid API key`); blocks `scripts/smoke/stage2_2_live_workspace_verify.ts` locally.

### 3. Deploy attempt

| Step | Result |
|------|--------|
| `gh workflow dispatch` | **BLOCKED** — `gh`: `bad CPU type in executable` (local ARM/Rosetta mismatch) |
| `wrangler` local deploy | **BLOCKED** — `wrangler` not installed; `CLOUDFLARE_API_TOKEN` unset |
| `git push origin HEAD:main` | **BLOCKED** — non-fast-forward (branch diverged; Stage 2.2 not merged) |
| Cloudflare Workers Builds MCP | Lists builds on other branches; **cannot promote unmerged Stage 2.2 code** |

**Canonical unblock path (operator):**

1. Commit Stage 2.2 scope → PR → merge to `main` (CI Check must pass).
2. GitHub Actions: **Deploy Cloudflare (Staging)** (`workflow_dispatch` or push to `main`).
3. Verify staging health `buildStamp` reflects merge commit; run signup smoke on staging.
4. **Deploy Cloudflare (Production)** follows staging success per `docs/runbooks/DEPLOYMENT_SOURCE_OF_TRUTH.md`.
5. Re-run `bun scripts/smoke/stage2_2_live_workspace_verify.ts` with **valid** live service role key (never commit).

### 4. Live signup verification

| Criterion | App path (deployed) | DB / schema parity (MCP) |
|-----------|---------------------|--------------------------|
| New `accounts` row `account_type=contractor` | **NOT TESTED** — old code live | PASS (tagged MCP CTE test) |
| New `tenants.account_id` set | **NOT TESTED** | PASS |
| `account_members` owner | **NOT TESTED** | PASS |
| `tenant_members` owner | **NOT TESTED** | PASS |
| No account-less tenant on create | **NOT TESTED** | Live inventory: **0** tenants with `account_id IS NULL` (3 total) |

MCP parity test used smoke users (`62d05b4f…` owner, `c2b2b2b2…` admin invitee), metadata tag `stage2_2_live_closure`. **This proves schema + RLS allow the chain; it does not prove deployed app logic.**

`scripts/smoke/stage2_2_live_workspace_verify.ts`: **FAIL** at auth user create — `Invalid API key` (local env).

### 5. Live invite verification

| Criterion | App path | DB audit |
|-----------|----------|----------|
| Internal role accept → `account_members` upsert | **NOT TESTED** (no deploy / no API test) | MCP parity: admin upsert PASS |
| Stakeholder accept → no `account_members` | **NOT TESTED** | Live: **0** stakeholder rows joined to `account_members` |
| Missing `account_id` → loud failure | **NOT TESTED** (requires deployed route) | Covered by unit tests only |

### 6. Cleanup

| Action | Result |
|--------|--------|
| Delete MCP tagged rows (`stage2_2_live_closure`) | **DONE** — account `c9fdf3d6…`, tenant `2b84925d…` removed |
| Remaining tagged accounts | **0** |

### 7. Validation (repo)

| Command | Result |
|---------|--------|
| `bun run lint` | PASS |
| `bun run test -- --run` | PASS — 335 files, 1689 tests |
| `lib/account/account-workspace*.test.ts` | PASS — 9 tests |
| `bun run cf:build` | Not run (deploy blocked; no CF credentials) |

---

## Remaining risks

1. **Production signup still broken** until Stage 2.2 app code deploys — schema requires `account_id`; live workers run pre-2.2 tenant insert path.
2. `SUPABASE_SERVICE_ROLE_KEY` is configured in Workers (**verified**); local operator copy must be rotated/aligned for smoke scripts.
3. Partial failure after `tenant_members` but before account sync on invite — sync failure returns 503 (user may retry accept).
4. No `/api/v1/me` account fields yet (optional P2).
5. Stage 2.2 changes sit uncommitted on a feature branch — release drift risk.

---

## Verdict

| Scope | Verdict |
|-------|---------|
| Repo implementation | **STAGE 2.2 CLOSED** |
| Live activation | **STAGE 2.2 LIVE NOT CLOSED** |

**Live NOT CLOSED blockers (ordered):**

1. Stage 2.2 code not merged/deployed (`buildStamp.sha7=1d6cf82` on prod + staging).
2. No end-to-end app signup or invite-accept proof on staging/production.
3. Local deploy tooling blocked (`gh` CPU arch, no `wrangler`/CF token).
4. Local live smoke script blocked (invalid service role key in operator `.env.local`).
