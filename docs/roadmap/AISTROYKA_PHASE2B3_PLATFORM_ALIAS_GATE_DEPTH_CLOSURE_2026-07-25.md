# AISTROYKA Phase 2B.3 — Platform Owner Middleware Depth for Admin Aliases

Date: 2026-07-25  
Batch: `2B_platform_gate_depth` only  
Repo: `/Users/alex/Projects/AISTROYKA`  
Prior: Phase 2B.2 accepted YES; migration `20260725143000_dequeue_tenant_job.sql` still **NOT APPLIED** (unchanged this phase)

Phase 2A inventory/matrix and Phase 2B.1 / 2B.2 closure artifacts are historical baseline — **not edited**.

Do **not** start Phase 2B.4. Do **not** apply migrations. Do **not** commit/push/deploy.

---

## Verdict

**YES** (after **Correction Pass 1** + **Correction Pass 2** — see §8–§9). All 11 routes / 13 methods remain middleware-classified; response preservation (including 429), worker patch fail-closed postcondition, and CSV `file::test` evidence integrity are closed.

`Allowed to proceed to Phase 2B.4: YES`

Overall Phase 2: **IN PROGRESS**  
Overall release: **NO-GO**

---

## 1. Baseline audit (pre-fix)

### 1.1 Classification gap

| Surface | Pre-change |
| --- | --- |
| `isPlatformAdminApiPath` | Only `/api/v1/owner` + `/api/v1/platform` via naive `startsWith` (also matched `platformish` / `ownerish`) |
| `/api/v1/admin/billing/**` | **Not** middleware-classified → `shouldBypassApiMiddleware` true → no `gateOwnerRequest` |
| `/api/v1/admin/leads/**` | Same bypass |
| Alias route modules | Thin `delegateLegacyTenantAdminPlatformApi` → canonical platform handlers |
| Handler guard | Canonical handlers still call `requirePlatformOwnerApi` (read/write) — defense-in-depth intact but middleware depth missing |
| Worker patch | Same owner+platform-only exception list |

### 1.2 Method matrix (audit snapshot → post-fix)

| # | Alias | Method | Canonical | Middleware pre | Handler mode | Deprecation | Post-fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `/api/v1/admin/billing/pilot-status` | GET | `/api/v1/platform/billing/pilot-status` | bypass | read | headers via delegate | classified + gate |
| 2 | `/api/v1/admin/billing/pilot-workspaces` | GET | `/api/v1/platform/billing/pilot-workspaces` | bypass | read | headers | classified + gate |
| 3 | `/api/v1/admin/billing/pilot-workspaces` | POST | same | bypass | write | headers | classified + gate |
| 4 | `/api/v1/admin/billing/pilot-workspaces/:workspaceId` | DELETE | `/api/v1/platform/billing/pilot-workspaces/:workspaceId` | bypass | write | headers | classified + gate |
| 5 | `/api/v1/admin/billing/process-pending-events` | POST | `/api/v1/platform/billing/process-pending-events` | bypass | write | headers | classified + gate |
| 6 | `/api/v1/admin/billing/provider-status` | GET | `/api/v1/platform/billing/provider-status` | bypass | read | headers | classified + gate |
| 7 | `/api/v1/admin/billing/reprocess-event` | POST | `/api/v1/platform/billing/reprocess-event` | bypass | write | headers | classified + gate |
| 8 | `/api/v1/admin/billing/reprocess-workspace-events` | POST | `/api/v1/platform/billing/reprocess-workspace-events` | bypass | write | headers | classified + gate |
| 9 | `/api/v1/admin/billing/workspace-status` | GET | `/api/v1/platform/billing/workspace-status` | bypass | read | headers | classified + gate |
| 10 | `/api/v1/admin/leads` | GET | `/api/v1/platform/leads` | bypass | read | headers | classified + gate |
| 11 | `/api/v1/admin/leads/:id` | GET | `/api/v1/platform/leads/:id` | bypass | read | headers | classified + gate |
| 12 | `/api/v1/admin/leads/:id` | PATCH | same | bypass | write | headers | classified + gate |
| 13 | `/api/v1/admin/leads/bulk` | PATCH | `/api/v1/platform/leads/bulk` | bypass | write | headers | classified + gate |

Counts after fix: middleware classified **13/13**; allow **13/13**; deny **13/13**; handler defense **13/13**; deprecation **13/13**.

### 1.3 Segment-boundary negatives (must stay non-owner)

- `/api/v1/admin/billingevil` (+ `/x`)
- `/api/v1/admin/leadership`
- `/api/v1/admin/leads-extra` (+ `/1`)
- `/api/v1/platformish` (+ `/overview`)
- `/api/v1/ownerish` (+ `/tenants`)
- Ordinary admin: `/api/v1/admin/flags`, `/api/v1/admin/jobs`
- `/api/v1/health`

---

## 2. Implementation

### 2.1 Shared classification source

`apps/web/lib/platform-admin/platform-api-middleware-exceptions.cjs`

Prefixes (segment-safe: `pathname === prefix || pathname.startsWith(prefix + "/")`):

1. `/api/v1/owner`
2. `/api/v1/platform`
3. `/api/v1/admin/billing`
4. `/api/v1/admin/leads`

Used by:

- `middleware-paths.ts` → `isPlatformAdminApiPath` / `shouldBypassApiMiddleware`
- Cloudflare worker patch via `buildIsPlatformOwnerApiPathExpression`

### 2.2 Constants

`LEGACY_ADMIN_BILLING_API_PREFIX` + `LEGACY_ADMIN_LEADS_API_PREFIX` in `apps/web/lib/platform-admin/constants.ts`.

### 2.3 Middleware behavior

`middleware.ts` already calls `gateOwnerRequest` when `isPlatformAdminApiPath(pathname)`. After classification fix, all 13 alias method/path combinations hit the gate **before** the alias handler. On allow, `OWNER_RATE_LIMIT_ALREADY_APPLIED` marker is set on the continued request. On deny, response returns immediately (no downstream).

### 2.4 Handler defense (unchanged contract)

Aliases remain thin wrappers via `delegateLegacyTenantAdminPlatformApi` — no business logic duplication. Canonical platform handlers still independently call `requirePlatformOwnerApi` with correct `read` / `write` mode. Deprecation headers only added on the outer response.

### 2.5 Host routing

Admin host allows classified platform-owner APIs (including admin billing/leads aliases). Ordinary `/api/v1/admin/flags` remains blocked / not owner-gated on public host.

---

## 3. Tests added/updated

| File | Role |
| --- | --- |
| `apps/web/lib/platform-admin/middleware-paths.test.ts` | Parameterized 11 alias paths + near-match negatives; bypass rules; CJS prefix expression |
| `apps/web/middleware.platform-alias-gate.test.ts` | 13× gate call / allow+marker / deny; ordinary admin not gated; platform+owner still gated |
| `apps/web/app/api/v1/admin/phase2b3-alias-gate.test.ts` | Success+deprecation, 401/403/OWNER_READONLY without mutation, OWNER_OPERATOR write preserved |
| `apps/web/lib/platform-admin/host-routing.test.ts` | Admin host allows billing/leads aliases |

Matrix CSV (exact test file + test name evidence):  
`docs/roadmap/AISTROYKA_PHASE2B3_PLATFORM_ALIAS_MATRIX.csv` — **exactly 13 rows**.

---

## 4. Problems found and fixed

1. **Missing middleware classification** for `/api/v1/admin/billing/**` and `/api/v1/admin/leads/**` — added to shared prefix list.
2. **Naive `startsWith` false positives** (`platformish`, `ownerish`, `billingevil`, `leadership`, `leads-extra`) — replaced with segment-safe matching.
3. **Worker bypass patch drift** — patch now generates expression from the same CJS module (includes billing/leads).
4. **Incomplete handler-defense coverage** for GET pilot-workspaces, POST reprocess-workspace-events, GET workspace-status, GET leads/:id — added dedicated 403 / OWNER_READONLY tests without business calls.
5. **CSV evidence** rewritten with exact Vitest names (`file::test`) and ` || ` multi-proof separators.

---

## 5. Files changed (this phase)

### Code

- `apps/web/lib/platform-admin/platform-api-middleware-exceptions.cjs` (new)
- `apps/web/lib/platform-admin/middleware-paths.ts`
- `apps/web/lib/platform-admin/constants.ts`
- `apps/web/scripts/patch-worker-bypass-api-middleware.cjs`
- `apps/web/lib/platform-admin/middleware-paths.test.ts`
- `apps/web/middleware.platform-alias-gate.test.ts` (new)
- `apps/web/app/api/v1/admin/phase2b3-alias-gate.test.ts` (new)
- `apps/web/lib/platform-admin/host-routing.test.ts` (updated)

### Docs

- `docs/roadmap/AISTROYKA_PHASE2B3_PLATFORM_ALIAS_GATE_DEPTH_CLOSURE_2026-07-25.md` (this file)
- `docs/roadmap/AISTROYKA_PHASE2B3_PLATFORM_ALIAS_MATRIX.csv`

Alias route modules themselves unchanged (already thin delegates).

---

## 6. Gates (initial Phase 2B.3 pass — superseded by §8)

Historical counts from the first closure pass (before Correction Pass 1). Do not use these for re-run claims:

| Gate | Notes |
| --- | --- |
| Core Phase 2B.3 suites | then 97 tests |
| Related set | then reported 13 files / 137 tests (undercount vs later re-run) |

Authoritative gate results: **§8 Correction Pass 1**.

### Invariants confirmed (still true)

- Phase 2A artifacts unchanged (SHA: matrix `c7ad7b01…`, inventory `1b28425c…`)
- Phase 2B.1 / 2B.2 closure artifacts unchanged (SHA: 2B.1 `b4f15377…`, 2B.2 MD `bc33b4a9…`, 2B.2 CSV `ed4a32c5…`)
- Migration `20260725143000_dequeue_tenant_job.sql` present, **not applied**, content SHA `488fcfed…`
- This phase did **not** edit dependency/lock files

---

## 7. Closure checklist (base + Correction Pass 1)

- [x] Audit 11 routes / 13 methods
- [x] Middleware classify both alias namespaces (segment-safe)
- [x] `gateOwnerRequest` before alias handlers; rate-limit marker on allow
- [x] Independent handler `requirePlatformOwnerApi` retained
- [x] Deprecation headers + exact status/statusText/body/header preservation
- [x] Route-level 429 GET + write proofs; shared delegate source audit (11 route.ts)
- [x] Worker patch fail-closed postcondition + idempotency regression
- [x] CSV 13 rows with real evidence (including shared preserve/429)
- [x] Full gates PASS (§8)

---

## 8. Correction Pass 1 — Response preservation + worker patch proof

Date: 2026-07-25

### 8.1 Tails found

1. No handler-level **429** preservation proof
2. Deprecation wrapper tests only asserted Deprecation/Link presence
3. No exact status / statusText / body / original-header preservation proofs
4. Worker patch could log `patched` even when regex did not apply / postcondition unmet
5. Closure related-suite count (13/137) mismatched independent re-run; command missing from report

### 8.2 Fixes

**Response preservation**

- Expanded `apps/web/lib/platform-admin/deprecation.test.ts`: 2xx, 204, 401/403/429, Set-Cookie, Retry-After, Content-Type, custom headers, Deprecation/Link replace-only
- Added `apps/web/lib/platform-admin/legacy-tenant-admin-api.test.ts`: shared delegate preserves 429/403/2xx/204 contracts

**Route-level 429**

- `phase2b3-alias-gate.test.ts`:
  - GET `/admin/billing/pilot-status` 429 preserve + no business call
  - POST `/admin/billing/reprocess-event` 429 preserve + no mutation
- Source audit: all **11** alias `route.ts` modules call `delegateLegacyTenantAdminPlatformApi` (shared wrapper)

**Worker patch fail-closed**

- `patch-worker-bypass-api-middleware.cjs`: exports `verifyPlatformOwnerBypassPostcondition` / `applyWorkerBypassPatch` / `patchWorkerBypassApiMiddleware`
- Existing worker + failed postcondition → **exit 1** (no success `patched` log)
- Missing worker → documented skip exit 0
- Postcondition requires generated segment-safe expression + all four namespaces
- Idempotent: second run does not duplicate bypass block
- Regression: `apps/web/scripts/patch-worker-bypass-api-middleware.test.ts`

### 8.3 Exact reproducible commands

**Response / deprecation / delegate + 429 + worker patch**

```bash
bun run --cwd apps/web test -- \
  lib/platform-admin/deprecation.test.ts \
  lib/platform-admin/legacy-tenant-admin-api.test.ts \
  app/api/v1/admin/phase2b3-alias-gate.test.ts \
  scripts/patch-worker-bypass-api-middleware.test.ts
```

**Core Phase 2B.3 (3 suites)**

```bash
bun run --cwd apps/web test -- \
  lib/platform-admin/middleware-paths.test.ts \
  middleware.platform-alias-gate.test.ts \
  app/api/v1/admin/phase2b3-alias-gate.test.ts
```

**Related owner/alias/deprecation set**

```bash
bun run --cwd apps/web test -- \
  lib/platform-admin/middleware-paths.test.ts \
  lib/platform-admin/host-routing.test.ts \
  lib/platform-admin/deprecation.test.ts \
  lib/platform-admin/legacy-tenant-admin-api.test.ts \
  lib/api/deprecation-headers.test.ts \
  middleware.platform-alias-gate.test.ts \
  middleware.host-routing.test.ts \
  lib/platform-owner/ \
  app/api/v1/admin/phase2b3-alias-gate.test.ts \
  app/api/v1/admin/billing/ \
  app/api/v1/admin/leads/ \
  scripts/patch-worker-bypass-api-middleware.test.ts
```

**Post-cf:build worker checks**

```bash
node -e "const {verifyPlatformOwnerBypassPostcondition}=require('./apps/web/scripts/patch-worker-bypass-api-middleware.cjs'); const fs=require('fs'); const r=verifyPlatformOwnerBypassPostcondition(fs.readFileSync('apps/web/.open-next/worker.js','utf8')); if(!r.ok){console.error(r); process.exit(1)}; console.log('postcondition OK', r);"
node apps/web/scripts/patch-worker-bypass-api-middleware.cjs   # idempotent second run
node apps/web/scripts/patch-worker-bypass-api-middleware.cjs   # third run still exit 0
```

### 8.4 Correction Pass 1 gate results

| Gate | Result | Notes |
| --- | --- | --- |
| Response/deprecation/delegate + 429 + worker | PASS exit 0 | **4 files / 47 tests** (command §8.3) |
| Core 3 suites | PASS exit 0 | **3 files / 99 tests** |
| Related set | PASS exit 0 | **15 files / 154 tests** |
| `bun run lint` | PASS exit 0 | eslint quiet clean |
| `bun run test` | PASS exit 0 | **350 files / 1986 tests** |
| `bun run build` | PASS exit 0 | Next build complete |
| `bun run cf:build` | PASS exit 0 | OpenNext + fail-closed worker patch |
| Post-build worker postcondition | PASS exit 0 | four namespaces + generated expression verified |
| Worker patch idempotent re-run ×2 | PASS exit 0 | `mode=already-satisfying`; hash stable; bypassBlocks=1 |
| `bun run --cwd apps/web check:design` | PASS exit 0 | no raw color classes |
| `node scripts/ci/validate-npm-lock.cjs` | PASS exit 0 | package-lock OK |
| `bun install --frozen-lockfile` | PASS exit 0 | Bun 1.2.15 |
| `npm audit` / `--omit=dev` | PASS exit 0 | 0 vulnerabilities |
| `git diff --check` | PASS exit 0 | clean |

Pre-recorded targeted suite tallies match the final re-runs above (47 / 99 / 154).

### 8.5 Files changed in Correction Pass 1

- `apps/web/lib/platform-admin/deprecation.test.ts`
- `apps/web/lib/platform-admin/legacy-tenant-admin-api.test.ts` (new)
- `apps/web/app/api/v1/admin/phase2b3-alias-gate.test.ts`
- `apps/web/scripts/patch-worker-bypass-api-middleware.cjs`
- `apps/web/scripts/patch-worker-bypass-api-middleware.test.ts` (new)
- `docs/roadmap/AISTROYKA_PHASE2B3_PLATFORM_ALIAS_GATE_DEPTH_CLOSURE_2026-07-25.md`
- `docs/roadmap/AISTROYKA_PHASE2B3_PLATFORM_ALIAS_MATRIX.csv`

Out-of-scope files changed: **none** (for this correction)  
Dependency/lock files changed: **NO**  
Migration applied: **NO**  
Commit/push/deploy: **NO**

---

## Remaining known Phase 2B.3 issues: none

---

## 9. Correction Pass 2 — Evidence integrity

Date: 2026-07-25

### 9.1 Reason

CSV `handler_defense_test` contained a narrative marker on all 13 rows:

`shared-delegate:source-audit all 11 alias route.ts call delegateLegacyTenantAdminPlatformApi`

That is not a `file::test` evidence reference and violated the evidence contract (13 malformed parts).

Runtime security from Pass 1 was already confirmed; this pass is evidence-only.

### 9.2 Fix

Added automatic source-inventory Vitest in `apps/web/lib/platform-admin/legacy-tenant-admin-api.test.ts`:

**Test name (static, CSV-safe):**  
`all 11 alias route modules expose exactly 13 methods through the shared canonical delegate`

Proves:

- exact 11 alias `route.ts` files exist under `admin/billing/**` + `admin/leads/**`
- no unknown route files in those trees
- each imports `delegateLegacyTenantAdminPlatformApi`
- each imports the matching canonical `/platform/` handler
- expected GET/POST/PATCH/DELETE exports present
- exactly 13 methods total, each body delegates through the shared helper
- aliases do not import supabase / domain / tenant / observability / ops / sre / `.service` / `.repository` directly

CSV: replaced all 13 narrative markers with:

`apps/web/lib/platform-admin/legacy-tenant-admin-api.test.ts::all 11 alias route modules expose exactly 13 methods through the shared canonical delegate`

Per-method denial + 429 evidence retained. Narrative source-audit wording remains only in `evidence` + this Markdown section.

### 9.3 CSV integrity

| Metric | Value |
| --- | --- |
| Rows | 13 |
| Malformed test evidence before | 13 |
| Malformed test evidence after | 0 |
| Missing files/tests | 0 |
| UNKNOWN / blank applicable | 0 |

### 9.4 Exact commands

```bash
bun run --cwd apps/web test -- lib/platform-admin/legacy-tenant-admin-api.test.ts

bun run --cwd apps/web test -- \
  lib/platform-admin/deprecation.test.ts \
  lib/platform-admin/legacy-tenant-admin-api.test.ts \
  app/api/v1/admin/phase2b3-alias-gate.test.ts \
  scripts/patch-worker-bypass-api-middleware.test.ts

bun run --cwd apps/web test -- \
  lib/platform-admin/middleware-paths.test.ts \
  middleware.platform-alias-gate.test.ts \
  app/api/v1/admin/phase2b3-alias-gate.test.ts

bun run --cwd apps/web test -- \
  lib/platform-admin/middleware-paths.test.ts \
  lib/platform-admin/host-routing.test.ts \
  lib/platform-admin/deprecation.test.ts \
  lib/platform-admin/legacy-tenant-admin-api.test.ts \
  lib/api/deprecation-headers.test.ts \
  middleware.platform-alias-gate.test.ts \
  middleware.host-routing.test.ts \
  lib/platform-owner/ \
  app/api/v1/admin/phase2b3-alias-gate.test.ts \
  app/api/v1/admin/billing/ \
  app/api/v1/admin/leads/ \
  scripts/patch-worker-bypass-api-middleware.test.ts
```

### 9.5 Gate results (Correction Pass 2)

| Gate | Result | Notes |
| --- | --- | --- |
| Inventory / legacy-tenant-admin-api | PASS exit 0 | **1 file / 5 tests** |
| Pass 1 correction 4 files | PASS exit 0 | **4 files / 48 tests** |
| Core 3 | PASS exit 0 | **3 files / 99 tests** |
| Related set | PASS exit 0 | **15 files / 155 tests** |
| CSV auto-validate 13 rows | PASS | malformed 0 / missing 0 / blank 0 / UNKNOWN 0 |
| `bun run lint` | PASS exit 0 | |
| `bun run test` | PASS exit 0 | **350 files / 1987 tests** |
| `bun run build` | PASS exit 0 | |
| `bun run cf:build` | PASS exit 0 | |
| Post-build worker postcondition | PASS exit 0 | four namespaces verified |
| `check:design` | PASS exit 0 | |
| npm lock / frozen install | PASS exit 0 | |
| `npm audit` / `--omit=dev` | PASS exit 0 | 0 vulnerabilities |
| `git diff --check` | PASS exit 0 | |

### 9.6 Files changed in Correction Pass 2

- `apps/web/lib/platform-admin/legacy-tenant-admin-api.test.ts`
- `docs/roadmap/AISTROYKA_PHASE2B3_PLATFORM_ALIAS_MATRIX.csv`
- `docs/roadmap/AISTROYKA_PHASE2B3_PLATFORM_ALIAS_GATE_DEPTH_CLOSURE_2026-07-25.md`

Product code changed: **NO**  
Dependency/lock files changed: **NO**  
Migration applied: **NO**  
Commit/push/deploy: **NO**
