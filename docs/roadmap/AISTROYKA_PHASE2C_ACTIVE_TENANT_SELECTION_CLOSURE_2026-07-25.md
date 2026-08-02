# AISTROYKA Phase 2C — Active Tenant Selection Closure (Corrective)

Date: 2026-07-25  
Batch: `2C_active_tenant_selection` only (inventory **T-P2-1**) — **corrective pass after independent audit**  
Repo: `/Users/alex/Projects/AISTROYKA`  
Branch: `security/platform-admin-separation`  
Migration `20260725143000_dequeue_tenant_job.sql` still **NOT APPLIED**

Phase 2A / 2B historical artifacts — **not edited**.  
Lite Phase 2C batches — **not started**.

Do **not** apply migrations. Do **not** commit/push/deploy.

---

## Verdict

**YES**

`Safe to proceed to next Phase 2C lite batch: YES` (only when owner requests)

Overall Phase 2: **IN PROGRESS**  
Overall release: **NO-GO**

In-scope tails remaining: **none**

---

## 1. Independent-audit tails (pre-fix)

| # | Tail | Status |
| --- | --- | --- |
| 1 | Fail-closed flags collapsed to `null` → onboarding/create could auto-create under bad header/cookie/DB error | **FIXED** |
| 2 | Cookie `aistroyka_active_tenant` read-only — no authenticated switch/clear write-path | **FIXED** |
| 2b | `assertSameOriginMutation` allowed missing Origin + missing Sec-Fetch-Site | **FIXED** (strict proof) |
| 3 | Duplicate cookies “last wins” (ambiguous under shadowing) | **FIXED** — fail closed |
| 4 | Callsite contract arity-only (`null`/`undefined` could pass) | **FIXED** — expression gate |

---

## 2. Fixes

### Fail-closed propagation

- `resolveTenantForCurrentUser` returns full `ResolveActiveTenantResult`
- `isActiveTenantResolutionBlocked` / `ActiveTenantBlockedError`
- `createTenantAndOwnerMembershipForCurrentUser` **throws** when blocked (never creates)
- `POST /api/v1/onboarding/complete` refuses auto-create when blocked (invite-token path may still accept invite)
- `shouldShowOnboarding` / activation+onboarding status fail closed (no false “needs onboarding”)

### Cookie write-path

- `POST /api/v1/tenant/active` `{ tenantId: uuid \| null }`
- `DELETE /api/v1/tenant/active` clear
- Auth + **strict** same-origin proof (`Origin` match **or** `Sec-Fetch-Site: same-origin`; missing both fail closed)
- Server membership/ownership check
- HttpOnly, `SameSite=Lax`, `Path=/`, `Secure` in production
- Browser-cookie only (no Bearer cookie-write bypass; API/mobile use `x-tenant-id`)

### Duplicate cookies

- `readNamedCookieStrict`: `duplicate` → `explicitRejected` (no first/last pick)

### Callsite gate

- Requires `request` / `req` / `await headers()` / `headersList` / `asActiveTenantRequest(...)`
- Rejects `null` / `undefined` / literals
- Narrow documented allowlist for definition/forwarder modules only

---

## 3. Validation

| Gate | Result |
| --- | --- |
| Focused resolver/onboarding/switch/callsite/tenant/middleware | PASS |
| CSRF same-origin negatives (missing both, foreign same-site, mismatch, invalid, cross-site) + positive | PASS |
| `bun run lint` | PASS |
| `bun run test` | PASS — 388 files / 2477 tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS — worker patch retained |
| Worker postcondition re-check | PASS (`already-satisfying`) |
| `bun run --cwd apps/web check:design` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS |

---

## 4. Constraints

| Constraint | Status |
| --- | --- |
| Phase 2A / 2B unchanged | YES |
| Migration applied | NO |
| Commit/push/deploy | NO |
| Credentials changed | NO |
| Dirty worktree preserved | YES |
| Next lite batch started | NO |

---

## 5. Out of this batch

- `2C_lite_idempotency_rate_limits`
- `2C_lite_read_scope`
- `2C_lite_prefix_boundary`

## Remaining known Phase 2C.this-batch issues

**none**
