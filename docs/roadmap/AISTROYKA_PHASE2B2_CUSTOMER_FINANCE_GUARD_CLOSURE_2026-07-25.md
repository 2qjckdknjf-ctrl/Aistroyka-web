# AISTROYKA Phase 2B.2 — Customer-Finance Guard Coverage Closure

Date: 2026-07-25  
Batch: `2B_customer_finance_guard_coverage` only  
Repo: `/Users/alex/Projects/AISTROYKA`  
Prior: Phase 2B.1 accepted; migration `20260725143000_dequeue_tenant_job.sql` still **NOT APPLIED** (unchanged this phase)

Phase 2A matrix artifacts are historical baseline only — **not edited**.

---

## Verdict

**YES** (after **Correction Pass 1** — see section at end). All 20 baseline GAP routes are guarded; known customer-finance GAP count is **0**. Initial pass had wrapper/test/CSV evidence defects; Pass 1 closed them.

Do **not** start Phase 2B.3 / 2C. Do **not** apply the Phase 2B.1 migration. Do **not** deploy.

---

## 1. Pre-change snapshot

### 1.1 Worktree

Pre-implementation `git status --short` included Phase 2B.1 code/docs plus unrelated dirty/untracked user work (QA platform, launch docs, AGENTS.md, etc.). **All preserved.** No commit/push/deploy.

### 1.2 Phase 2A customer surface (baseline only)

| Metric | Count |
| --- | --- |
| `customer_facing=yes` | 28 |
| Baseline PROVEN (route guard + leak test) | 8 |
| Baseline GAP → batch `2B_customer_finance_guard_coverage` | 20 |

### 1.3 Pre-change audit table (20 GAP)

| # | Route | Methods | Audience | Auth / tenant | Manager branch | Stakeholder/customer branch | Portal alias? | Response DTO source | Pre-change finance guard | Pre-change route test | Pre-change finance injection | Minimal fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `/api/v1/portal/projects` | GET | portal | session + `ctx.tenantId` | n/a | list portal projects | yes (portal) | `listPortalProjects` | none | partial | no | Guard final `{data}` |
| 2 | `/api/v1/portal/projects/:id/change-orders/:changeOrderId` | GET | portal | session | via re-export could return manager row | public detail | re-export of projects GET | `getChangeOrderDetail` | none on alias | none | no | Dedicated portal handler + `forcePublic` + guard |
| 3 | `/api/v1/portal/.../change-orders/.../respond` | POST | portal | session | n/a | customer respond | re-export | `respondToChangeOrderByCustomer` | none on alias | none | no | Wrap with `enforceCustomerFinanceOnJsonResponse` |
| 4 | `/api/v1/portal/.../decisions/.../respond` | POST | portal | session | n/a | customer respond | re-export | `respondToClientRequest` | none on alias | partial | no | Wrap with enforce helper |
| 5 | `/api/v1/projects/:id/change-orders` | GET\|POST | dual | session + tenant | GET/POST full internal rows | GET public list | no | `listChangeOrders` / `createChangeOrder` | none | none | no | Guard stakeholder GET only |
| 6 | `/api/v1/projects/:id/change-orders/:changeOrderId` | GET\|PATCH | dual | session | GET full row; PATCH manager | GET public detail | no | `getChangeOrderDetail` / update | none | none | no | Guard stakeholder GET only |
| 7 | `/api/v1/projects/:id/change-orders/:changeOrderId/respond` | POST | customer | session | n/a | respond | no | public detail | none | none | no | Always guard |
| 8 | `/api/v1/projects/:id/client-portal` | PATCH | manager settings (matrix customer_facing) | session | settings update | n/a | no | portal settings | none | partial | no | Guard response body |
| 9 | `/api/v1/projects/:id/client-requests` | GET\|POST | dual | session | manager list/create | stakeholder list | no | list/create services | none | partial | no | Guard stakeholder GET |
| 10 | `/api/v1/projects/:id/client-requests/:requestId` | GET\|PATCH | dual | session | manager get/patch | stakeholder get | no | get/patch services | none | none | no | Guard stakeholder GET |
| 11 | `/api/v1/projects/:id/client-requests/:requestId/respond` | POST | customer | session | n/a | respond | no | respond service | none | none | no | Always guard |
| 12 | `/api/v1/projects/:id/client-view` | GET | customer | session | n/a | full client view | no | `getClientProjectView` | none | partial | no | Always guard |
| 13 | `/api/v1/projects/:id/decisions` | GET | customer | session | n/a | stakeholder list | no | `listClientRequests(viewer=stakeholder)` | none | none | no | Always guard |
| 14 | `/api/v1/projects/:id/estimates` | GET\|POST | dual | session | manager list/create | `viewer=customer` list | no | customer estimates | none | none | no | Guard customer GET |
| 15 | `/api/v1/projects/:id/estimates/:estimateId/respond` | POST | customer | session | n/a | respond | no | respond service | none | none | no | Always guard |
| 16 | `/api/v1/projects/:id/handover` | GET | dual | session | manager handover | public summary | no | handover service | none | none | no | Guard stakeholder branch |
| 17 | `/api/v1/projects/:id/handover/pack` | GET | dual | session | manager pack | owner pack | no | pack builders | none | none | no | Guard owner pack |
| 18 | `/api/v1/projects/:id/stakeholder-activity` | GET | dual | session | manager timeline | stakeholder timeline | no | activity repo | none | partial | no | Guard stakeholder branch |
| 19 | `/api/v1/projects/:id/stakeholder-notifications` | GET | stakeholder | session | n/a | notifications | no | notif repo public rows | none | none | no | Always guard |
| 20 | `/api/v1/stakeholder-invites/accept` | POST | customer onboarding | session (no prior tenant) | n/a | accept invite | no | accept service | none | none | no | Always guard |

### 1.4 Pre-change PROVEN re-check (8)

| Route | Pre-change guard | Pre-change leak test | Re-check result |
| --- | --- | --- | --- |
| `GET /api/v1/portal/projects/:id` | `assertCustomerFinanceSafePayload` | yes (`budget_pressure`) | Still PROVEN; added `budget_delta_amount` injection |
| `GET /api/v1/portal/projects/:id/change-orders` | route assert | yes | Still PROVEN; now `forcePublic` so manager internal rows never serialize on portal |
| `GET /api/v1/portal/projects/:id/decisions` | route assert | yes | Still PROVEN |
| `GET /api/v1/portal/projects/:id/documents` | route assert | yes | Still PROVEN |
| `GET /api/v1/portal/projects/:id/estimates` | route assert | yes | Still PROVEN |
| `GET /api/v1/portal/projects/:id/progress` | route assert | yes | Still PROVEN |
| `GET /api/v1/portal/projects/:id/proof` | route assert | yes | Still PROVEN |
| `GET /api/v1/share/proof/:token` | route assert | via guard module | Still PROVEN (guard keys extended) |

### 1.5 Guard blind spot (pre-change)

`apps/web/lib/security/customer-finance-guard.ts` did **not** forbid `budget_delta_amount` / `budget_impact_level`, so portal manager-shaped payloads could pass the old guard while still leaking internal budget fields.

---

## 2. Implementation

### 2.1 Guard core

- Extended `FORBIDDEN_KEYS` with `budget_delta_amount`, `budget_impact_level`.
- Preserved existing fail-closed nested walk, case-insensitive keys, `internal_cost*` substring ban.
- Legal commercial fields remain allowed: `amount`, `total_amount`, `customer_amount_delta`, `customer_visible_amount`, `currency`, `schedule_delta_days`.
- Added `apps/web/lib/security/customer-finance-response.ts`:
  - `jsonWithCustomerFinanceGuard(route, body)` — guards **final** JSON body; on violation → HTTP 500 `{ error: "Payload failed finance safety guard" }` (no key/path/value leak).
  - `enforceCustomerFinanceOnJsonResponse(route, response)` — for portal wrappers; non-200 pass-through; 200 JSON re-checked.

### 2.2 Dual-audience policy

- Customer/stakeholder success paths: always guarded.
- Manager-only branches on `/api/v1/projects/...` (non-portal): internal fields allowed when proven manager contract.
- Portal URLs: always customer surface.
  - Change-order list/detail: `forcePublic: true` so managers do not receive internal CO rows via portal (proper public DTO, then guard — not silent strip of forbidden keys from manager payloads).

### 2.3 Portal alias handling

| Alias | Fix |
| --- | --- |
| change-order detail | Replaced re-export with dedicated portal handler + `forcePublic` + guard |
| change-order respond | Thin wrapper + `enforceCustomerFinanceOnJsonResponse` |
| decisions respond | Thin wrapper + `enforceCustomerFinanceOnJsonResponse` |
| portal change-orders list (already PROVEN) | `listChangeOrders(..., { forcePublic: true })` |

### 2.4 Service support

`listChangeOrders` / `getChangeOrderDetail` accept optional `{ forcePublic?: boolean }` for portal-safe public projection without weakening manager `/projects` contracts.

---

## 3. Post-change route closure (summary)

Artifact: `docs/roadmap/AISTROYKA_PHASE2B2_CUSTOMER_FINANCE_ROUTE_CLOSURE.csv`  
**(Correction Pass 1):** CSV must contain **exactly 20** baseline GAP rows (not 28). All 28 customer-facing routes are summarized in Markdown (Pass 1).

| Metric | Value |
| --- | --- |
| Customer-facing routes (Markdown) | 28 |
| Baseline protected (Phase 2A) | 8 |
| Baseline GAP closed this phase (CSV rows) | **20** |
| Known customer-finance GAP after Phase 2B.2 | **0** |
| CSV post-status PROVEN | 20 |

---

## 4. Tests added / updated

- Guard unit: legal commercial fields; new forbidden keys (case-insensitive); 500 body must not leak path/key/value.
- `customer-finance-response.test.ts` for portal enforce helper.
- Finance injection / dual-audience tests for all 20 GAP routes (+ portal wrappers).
- Proven portal detail: `budget_delta_amount` injection.
- Change-order service: `forcePublic` strips manager budget fields.

Targeted finance suite: **30 files / 62 tests PASS**.

---

## 5. Validation

| Check | Result |
| --- | --- |
| Targeted finance vitest (30 files) | PASS — 62 tests |
| `bun run lint` | PASS (0) |
| `bun run test` | PASS — 346 files, **1839** tests (0) |
| `bun run build` | PASS (0) |
| `bun run cf:build` | PASS (0) |
| `bun run --cwd apps/web check:design` | PASS (0) |

---

## 6. Re-audit after fix

- Every baseline GAP customer/stakeholder/portal success path uses `jsonWithCustomerFinanceGuard`, `enforceCustomerFinanceOnJsonResponse`, or existing `assertCustomerFinanceSafePayload`.
- Portal aliases are not trusted solely because the projects handler is partially safe.
- Final serialized JSON is guarded (not only intermediate DTO helpers).
- Manager `/projects` change-order/estimate/handover/activity paths still return internal fields when audience is manager.
- No silent field stripping of forbidden keys into a partial 200 response.
- Phase 2A CSV/MD untouched; GAP labels remain as historical baseline.

---

## 7. Files changed (Phase 2B.2 scope)

### Core

- `apps/web/lib/security/customer-finance-guard.ts`
- `apps/web/lib/security/customer-finance-guard.test.ts`
- `apps/web/lib/security/customer-finance-response.ts` (new)
- `apps/web/lib/security/customer-finance-response.test.ts` (new)
- `apps/web/lib/domain/change-orders/change-orders.service.ts` (`forcePublic`)
- `apps/web/lib/domain/change-orders/change-orders.service.test.ts`

### Routes (GAP + portal alias / proven portal list)

- `apps/web/app/api/v1/portal/projects/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/change-orders/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/change-orders/[changeOrderId]/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/change-orders/[changeOrderId]/respond/route.ts`
- `apps/web/app/api/v1/portal/projects/[id]/decisions/[requestId]/respond/route.ts`
- `apps/web/app/api/v1/projects/[id]/change-orders/route.ts`
- `apps/web/app/api/v1/projects/[id]/change-orders/[changeOrderId]/route.ts`
- `apps/web/app/api/v1/projects/[id]/change-orders/[changeOrderId]/respond/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-portal/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-requests/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-requests/[requestId]/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-requests/[requestId]/respond/route.ts`
- `apps/web/app/api/v1/projects/[id]/client-view/route.ts`
- `apps/web/app/api/v1/projects/[id]/decisions/route.ts`
- `apps/web/app/api/v1/projects/[id]/estimates/route.ts`
- `apps/web/app/api/v1/projects/[id]/estimates/[estimateId]/respond/route.ts`
- `apps/web/app/api/v1/projects/[id]/handover/route.ts`
- `apps/web/app/api/v1/projects/[id]/handover/pack/route.ts`
- `apps/web/app/api/v1/projects/[id]/stakeholder-activity/route.ts`
- `apps/web/app/api/v1/projects/[id]/stakeholder-notifications/route.ts`
- `apps/web/app/api/v1/stakeholder-invites/accept/route.ts`

### Tests (new/updated finance coverage)

- Portal list/detail/alias finance tests; `*.finance.test.ts` under projects GAP routes; proven portal detail `budget_delta_amount` case.

### Docs

- `docs/roadmap/AISTROYKA_PHASE2B2_CUSTOMER_FINANCE_GUARD_CLOSURE_2026-07-25.md` (this file)
- `docs/roadmap/AISTROYKA_PHASE2B2_CUSTOMER_FINANCE_ROUTE_CLOSURE.csv`

---

## 8. Remaining blockers

| Item | Status |
| --- | --- |
| Phase 2B.1 migration apply / deploy | External / owner — **out of scope**; still NOT APPLIED |
| Phase 2B.3+ | Not started |
| Unrelated dirty worktree files | Preserved; not part of this phase |

No known local customer-finance defect remains inside Phase 2B.2 scope.

---

## 9. Closure checklist

- [x] Pre-change audit table recorded before implementation claims
- [x] 20 GAP routes closed with customer-branch guards
- [x] Portal aliases independently enforced / forcePublic where needed
- [x] Forbidden keys include `budget_delta_amount` + `budget_impact_level`
- [x] Fail-closed 500 without leaking key/path/value
- [x] Manager non-portal internal contracts preserved
- [x] Finance injection tests for GAP routes
- [x] 8 PROVEN routes re-verified
- [x] Phase 2A matrix not rewritten
- [x] lint / test / build / cf:build / design green
- [x] Closure CSV under `docs/roadmap/` (not only ignored `evidence/`)

**Allowed to proceed to Phase 2B.3: YES (only when explicitly requested)**  
**Phase 2B.2 verdict: YES** (superseded by Correction Pass 1 below if criteria failed; Pass 1 re-verified)

---

## PHASE 2B.2 CORRECTION PASS 1

Date: 2026-07-25  
Scope: fix defects in wrapper, route proofs, CSV evidence, and validation gates.  
Do **not** start Phase 2B.3 / 2C. Migration still **NOT APPLIED**. No commit/push/deploy.

### Found defects

1. `enforceCustomerFinanceOnJsonResponse` only guarded status `200`, consumed body, rebuilt response → lost headers/statusText/cookies/exact body; missed other 2xx (e.g. 201).
2. Most route finance injection tests asserted only `status === 500` without proving generic error contract and absence of key/path/value.
3. Safe success proofs incomplete for several GAP routes / portal aliases.
4. Manager dual-audience and manager-only mutation contracts incomplete.
5. Closure CSV had 28 rows (included baseline PROVEN), blank `test_files`, and weak evidence.
6. Closure gates incomplete (lock/frozen/npm audit/diff-check not recorded).

### Fixes applied

| Area | Fix |
| --- | --- |
| Wrapper | Guard all JSON success `200–299` except body-less `204`; `response.clone()` for parse; return **original** response when safe; generic 500 without copying unsafe cookies/headers |
| Test helper | `apps/web/tests/helpers/customer-finance-route-assertions.ts` → `expectCustomerFinanceBlocked` (exact `{ error: "Payload failed finance safety guard" }`, no key/path/value/data) |
| GAP route tests | Safe success + no-leak unsafe injection for all 20; manager GET/mutation proofs; portal alias safe/unsafe + header-preserve helper proofs |
| CSV | Recreated with **exactly 20** baseline GAP rows, real test file paths and real `it(...)` names |
| Docs | This Correction Pass 1 section |

### Response wrapper proofs (unit)

File: `apps/web/lib/security/customer-finance-response.test.ts` — **10 tests PASS**, including:

- same-object safe 200; custom header; statusText + body
- safe 201 preserves status/headers/body
- unsafe 201 blocked without leak; no set-cookie copy to 500
- 204 unchanged; non-2xx unchanged; malformed JSON blocked

### 20 GAP CSV validation

| Check | Result |
| --- | --- |
| Rows | 20 |
| Unique routes | 20 |
| Baseline GAP only | YES |
| Blank applicable evidence | 0 |
| `route_test_file` exists | 20/20 |
| Named safe/injection tests present in files | YES |
| Manager fields for dual-audience | YES |
| Alias fields for 3 portal aliases | YES |

Artifact: `docs/roadmap/AISTROYKA_PHASE2B2_CUSTOMER_FINANCE_ROUTE_CLOSURE.csv`

### All 28 customer-facing routes (Markdown summary)

| # | Route | Baseline | After 2B.2 + Pass 1 |
| --- | --- | --- | --- |
| 1 | `GET /api/v1/portal/projects` | GAP | PROVEN (CSV) |
| 2 | `GET /api/v1/portal/projects/:id` | PROVEN | PROVEN (re-tested) |
| 3 | `GET /api/v1/portal/projects/:id/change-orders` | PROVEN | PROVEN (re-tested; forcePublic) |
| 4 | `GET /api/v1/portal/projects/:id/change-orders/:changeOrderId` | GAP | PROVEN (CSV) |
| 5 | `POST .../change-orders/:changeOrderId/respond` (portal) | GAP | PROVEN (CSV) |
| 6 | `GET /api/v1/portal/projects/:id/decisions` | PROVEN | PROVEN (re-tested) |
| 7 | `POST .../decisions/:requestId/respond` (portal) | GAP | PROVEN (CSV) |
| 8 | `GET /api/v1/portal/projects/:id/documents` | PROVEN | PROVEN (re-tested) |
| 9 | `GET /api/v1/portal/projects/:id/estimates` | PROVEN | PROVEN (re-tested) |
| 10 | `GET /api/v1/portal/projects/:id/progress` | PROVEN | PROVEN (re-tested) |
| 11 | `GET /api/v1/portal/projects/:id/proof` | PROVEN | PROVEN (re-tested) |
| 12 | `GET /api/v1/share/proof/:token` | PROVEN | PROVEN (re-tested) |
| 13 | `GET\|POST /api/v1/projects/:id/change-orders` | GAP | PROVEN (CSV) |
| 14 | `GET\|PATCH /api/v1/projects/:id/change-orders/:changeOrderId` | GAP | PROVEN (CSV) |
| 15 | `POST /api/v1/projects/:id/change-orders/:changeOrderId/respond` | GAP | PROVEN (CSV) |
| 16 | `PATCH /api/v1/projects/:id/client-portal` | GAP | PROVEN (CSV) |
| 17 | `GET\|POST /api/v1/projects/:id/client-requests` | GAP | PROVEN (CSV) |
| 18 | `GET\|PATCH /api/v1/projects/:id/client-requests/:requestId` | GAP | PROVEN (CSV) |
| 19 | `POST /api/v1/projects/:id/client-requests/:requestId/respond` | GAP | PROVEN (CSV) |
| 20 | `GET /api/v1/projects/:id/client-view` | GAP | PROVEN (CSV) |
| 21 | `GET /api/v1/projects/:id/decisions` | GAP | PROVEN (CSV) |
| 22 | `GET\|POST /api/v1/projects/:id/estimates` | GAP | PROVEN (CSV) |
| 23 | `POST /api/v1/projects/:id/estimates/:estimateId/respond` | GAP | PROVEN (CSV) |
| 24 | `GET /api/v1/projects/:id/handover` | GAP | PROVEN (CSV) |
| 25 | `GET /api/v1/projects/:id/handover/pack` | GAP | PROVEN (CSV) |
| 26 | `GET /api/v1/projects/:id/stakeholder-activity` | GAP | PROVEN (CSV) |
| 27 | `GET /api/v1/projects/:id/stakeholder-notifications` | GAP | PROVEN (CSV) |
| 28 | `POST /api/v1/stakeholder-invites/accept` | GAP | PROVEN (CSV) |

Customer-facing total: **28/28**. Known customer-finance GAP remaining: **0**.

### 25-method audit

| Route | Method | Audience | Success contract | Guard required | Guard location | Safe success test | Unsafe injection / n/a | Manager preservation / n/a | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| portal/projects | GET | portal | `{ data: ProjectSummary[] }` | yes | jsonWithCustomerFinanceGuard | returns safe project list… | blocks … budget_delta_amount… | n/a | PASS |
| portal/.../change-orders/:id | GET | portal | `{ data, audience: stakeholder }` | yes | forcePublic + guard | returns safe public detail… | blocks … budget_delta_amount… | n/a (portal) | PASS |
| portal/.../change-orders/:id/respond | POST | portal | `{ data }` public | yes | enforce wrapper | returns safe respond… | blocks … budget_delta_amount… | n/a + header preserve helper | PASS |
| portal/.../decisions/:id/respond | POST | portal | `{ data }` | yes | enforce wrapper | returns safe respond payload | blocks … margin… | n/a + header preserve helper | PASS |
| projects/.../change-orders | GET | dual | list | stakeholder yes / manager no | stakeholder guard | returns safe stakeholder list… | blocks stakeholder leak… | preserves manager GET… | PASS |
| projects/.../change-orders | POST | manager | `{ data }` internal | no | none | n/a (mutation) | n/a manager-only | preserves manager POST create… | PASS |
| projects/.../change-orders/:id | GET | dual | detail | stakeholder yes / manager no | stakeholder guard | returns safe stakeholder detail… | blocks stakeholder leak… | preserves manager GET… | PASS |
| projects/.../change-orders/:id | PATCH | manager | `{ ok: true }` | no | none | n/a | n/a | preserves manager PATCH ok:true exact | PASS |
| projects/.../change-orders/:id/respond | POST | customer | `{ data }` | yes | guard | returns safe respond… | blocks … planned_amount… | n/a | PASS |
| projects/.../client-portal | PATCH | manager settings (matrix CF) | `{ data }` | yes | guard | returns safe settings… | blocks … cost_overrun… | n/a (always guarded) | PASS |
| projects/.../client-requests | GET | dual | list | stakeholder yes / manager no | stakeholder guard | returns safe stakeholder list | blocks stakeholder leak… | preserves manager GET… | PASS |
| projects/.../client-requests | POST | manager | `{ data }` | no | none | n/a | n/a | preserves manager POST create… | PASS |
| projects/.../client-requests/:id | GET | dual | detail | stakeholder yes / manager no | stakeholder guard | returns safe stakeholder detail | blocks stakeholder leak… | preserves manager GET… | PASS |
| projects/.../client-requests/:id | PATCH | manager | `{ data }` | no | none | n/a | n/a | preserves manager PATCH… | PASS |
| projects/.../client-requests/:id/respond | POST | customer | `{ data }` | yes | guard | returns safe respond… | blocks … ai_finance_risk… | n/a | PASS |
| projects/.../client-view | GET | customer | `{ data }` view | yes | guard | returns safe shaped data… | blocks … budget_impact_level… | n/a | PASS |
| projects/.../decisions | GET | customer | `{ data }` | yes | guard | returns safe decisions list | blocks … project_cost_items… | n/a | PASS |
| projects/.../estimates | GET | dual | list | customer yes / manager no | customer guard | returns safe customer viewer list… | blocks customer viewer leak… | preserves manager GET… | PASS |
| projects/.../estimates | POST | manager | `{ data }` **201** | no | none | n/a | n/a | preserves manager POST … status 201 | PASS |
| projects/.../estimates/:id/respond | POST | customer | `{ data }` | yes | guard | returns safe respond… | blocks … margin… | n/a | PASS |
| projects/.../handover | GET | dual | summary | stakeholder yes / manager no | stakeholder guard | returns safe stakeholder handover… | blocks stakeholder leak… | preserves manager GET… | PASS |
| projects/.../handover/pack | GET | dual | pack | owner yes / manager no | owner guard | returns safe owner pack | blocks owner pack … margin… | preserves manager pack… | PASS |
| projects/.../stakeholder-activity | GET | dual | timeline | stakeholder yes / manager no | stakeholder guard | returns safe stakeholder activity | blocks stakeholder leak… | preserves manager activity… | PASS |
| projects/.../stakeholder-notifications | GET | stakeholder | `{ data, unread }` | yes | guard | returns safe notification list | blocks … budget_pressure… | n/a | PASS |
| stakeholder-invites/accept | POST | customer | `{ data, redirect_path }` | yes | guard | returns safe accept payload… | blocks … internal_cost_item_id… | n/a | PASS |

**Methods audited: 25/25. Unknown: 0. Untested customer success: 0. Untested manager: 0. Untested aliases: 0.**

### Manager branch proofs

- Manager GET: **8/8** (change-orders list/detail, client-requests list/detail, estimates, handover, handover/pack, stakeholder-activity)
- Manager-only mutations: **5/5** (POST change-orders, PATCH change-order `{ok:true}`, POST client-requests, PATCH client-request, POST estimates **201**)

### Alias proofs

- **3/3** portal aliases: direct safe + unsafe route tests; POST wrappers also prove header/status preserve via enforce helper tests

### Full gate results (Correction Pass 1)

| Gate | Result |
| --- | --- |
| Targeted customer-finance suite | PASS — 2 files, 15 tests |
| All tests for 20 GAP routes | PASS — 20 files, 59 tests |
| Tests for 8 baseline PROVEN routes | PASS — 8 files, 20 tests |
| `bun run lint` | PASS (0) |
| `bun run test` | PASS — 346 files, **1875** tests (0) |
| `bun run build` | PASS (0) |
| `bun run cf:build` | PASS (0) |
| `bun run --cwd apps/web check:design` | PASS (0) |
| `node scripts/ci/validate-npm-lock.cjs` | PASS (0) |
| `bun install --frozen-lockfile` | PASS (0) |
| `npm audit` | PASS — 0 vulnerabilities |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |
| `git diff --check` | PASS (0) |
| Dependency/lock files changed by correction | **NO** (pre-existing Phase 1 dirty manifests preserved; correction did not edit them) |
| Phase 2A artifacts changed | **NO** (mtime 2026-07-25 14:43; not edited) |

### Correction files touched

**Product:** `apps/web/lib/security/customer-finance-response.ts`  
**Tests:** `customer-finance-response.test.ts`; GAP/portal finance route tests; `apps/web/tests/helpers/customer-finance-route-assertions.ts`  
**Evidence:** this MD + rebuilt 20-row CSV  
**Out-of-scope:** none intentionally  
**User changes preserved:** YES

### Remaining known Phase 2B.2 issues

None known inside Phase 2B.2 scope after Correction Pass 1.

### Correction verdict

**Phase 2B.2 Correction Pass 1: YES**  
**Allowed to proceed to Phase 2B.3: YES (only when explicitly requested)**  
Overall Phase 2: IN PROGRESS  
Overall release: NO-GO  
Migration applied: NO · Commit: NO · Push: NO · Deploy: NO
