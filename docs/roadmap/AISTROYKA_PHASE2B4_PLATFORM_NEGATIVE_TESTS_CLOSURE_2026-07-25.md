# AISTROYKA Phase 2B.4 — Canonical Platform API Negative Access Closure

Date: 2026-07-25  
Batch: `2B_platform_negative_tests` only  
Repo: `/Users/alex/Projects/AISTROYKA`  
Prior: Phase 2B.3 accepted YES; migration `20260725143000_dequeue_tenant_job.sql` still **NOT APPLIED** (unchanged this phase)

Phase 2A inventory/matrix and Phase 2B.1 / 2B.2 / 2B.3 closure artifacts are historical baseline — **not edited**.

Do **not** start Phase 2B.5. Do **not** apply migrations. Do **not** commit/push/deploy.

---

## Verdict

**YES**

`Allowed to proceed to Phase 2B.5: YES`

Overall Phase 2: **IN PROGRESS**  
Overall release: **NO-GO**

---

## 1. Inventory audit

| Metric | Count |
| --- | --- |
| Platform route files on disk | **25/25** |
| HTTP methods | **29/29** |
| GET / POST / PATCH / DELETE | **17 / 8 / 3 / 1** |
| Guard modes read / write / critical | **18 / 10 / 1** |
| UNKNOWN methods | **0** |
| Deprecated `/api/v1/admin/**` aliases in scope | **excluded** (closed in 2B.3) |

Baseline source: `docs/roadmap/AISTROYKA_PHASE2A_API_ROUTE_MATRIX.csv` rows with `recommended_fix_batch=2B_platform_negative_tests`.

Pre-fix finding (only product gap in scope):

- Route `POST /api/v1/platform/testing/safe-audit/refresh` uses handler `mode: "read"` (non-persistent recomputation).
- Blanket `assertOwnerHttpMethodForRole` blocked **all** non-GET methods for `OWNER_READONLY`, contradicting the documented read contract.
- Middleware and handler now share one exact method+path exception (no `/testing/**` widen).

All 25 handlers already called `requirePlatformOwnerApi` before params/body/admin/DB/services — no pre-guard side-effect reordering required.

---

## 2. Problems found

1. **OWNER_READONLY vs safe-audit refresh POST contradiction** — blanket HTTP method policy denied the documented read-mode POST.
2. **No executable `route.test.ts` under `/api/v1/platform/**`** — Phase 2A marked `none_route_level` / GAP.
3. **No central executable suite for `requirePlatformOwnerApi`** covering anonymous / tenant / stakeholder / service-role / grant failures / capability matrix / rate-limit preservation.
4. **No middleware suite covering all 29 canonical platform method/path combinations**.

---

## 3. Fixes applied

### Product

- `apps/web/lib/platform-owner/owner-capabilities.ts`
  - Added `OWNER_READONLY_ALLOWED_POST_PATH` + `isOwnerReadonlyAllowedMutation`
  - `assertOwnerHttpMethodForRole(role, method, pathname?)` exact-path exception only
- `apps/web/lib/platform-owner/require-platform-owner-api.ts` — passes `pathname` into method gate
- `apps/web/lib/platform-owner/middleware-owner-gate.ts` — same shared policy

### Tests / inventory

- Central: `require-platform-owner-api.test.ts`, expanded `owner-capabilities.test.ts`, `middleware-owner-gate.readonly-post.test.ts`
- Middleware 29-method suite: `middleware.platform-negative.test.ts`
- 25 route `route.test.ts` files (29 methods × negative identities + mode/side-effect/allowed-role proofs)
- Shared helper: `tests/helpers/platform-owner-route-assertions.ts`
- Inventory constants + integrity: `phase2b4-platform-inventory.ts` / `.test.ts`

### Evidence artifacts

- `docs/roadmap/AISTROYKA_PHASE2B4_PLATFORM_ROUTE_SECURITY_MATRIX.csv` — **29** PROVEN rows
- This closure note

---

## 4. Proof counts

| Proof class | Count |
| --- | --- |
| Middleware proofs | **29/29** |
| Handler guard proofs | **29/29** |
| Negative identity proofs (29 × 6) | **174/174** |
| Denial no-side-effect proofs | **29/29** |
| Read role contracts | **18/18** |
| Write role contracts | **10/10** |
| Critical role contracts | **1/1** |
| Safe-audit readonly POST contradiction resolved | **YES** |
| CSV rows | **29** |
| CSV malformed/missing evidence | **0** |
| Route test files | **25/25** |

---

## 5. Validation

Targeted (exit 0):

```text
bunx vitest run \
  lib/platform-owner/owner-capabilities.test.ts \
  lib/platform-owner/require-platform-owner-api.test.ts \
  lib/platform-owner/phase2b4-platform-inventory.test.ts \
  lib/platform-owner/middleware-owner-gate.readonly-post.test.ts \
  middleware.platform-negative.test.ts \
  middleware.platform-alias-gate.test.ts \
  app/api/v1/admin/phase2b3-alias-gate.test.ts \
  app/api/v1/platform
→ 32 files / 488 tests passed
```

Full gates (all exit 0):

| Gate | Result |
| --- | --- |
| `bun run lint` | PASS |
| `bun run test` | PASS — 379 files / 2402 tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS — worker patch applied (segment-safe owner/platform/admin billing\|leads) |
| Worker postcondition | PASS — `.open-next/worker.js` retains platform + admin billing/leads exceptions |
| `bun run --cwd apps/web check:design` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `bun install --frozen-lockfile` | PASS (no lockfile edits by this phase) |
| `npm audit` | PASS — 0 vulnerabilities |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS |

---

## 6. Constraints preserved

| Constraint | Status |
| --- | --- |
| Phase 2A artifacts unchanged | YES |
| Phase 2B.1 / 2B.2 / 2B.3 artifacts unchanged | YES |
| Dependency / lock files changed | NO |
| Migration applied | NO |
| Commit / push / deploy | NO |
| Customer-finance / role-model unification / lite cleanup | untouched |
| User dirty worktree preserved | YES |

---

## 7. Remaining known Phase 2B.4 issues

**none**

---

## 8. Next phase gate

`Allowed to proceed to Phase 2B.5: YES`
