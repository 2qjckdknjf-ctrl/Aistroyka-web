# Final E2E report (Phase 13)

**Roadmap:** Phase 13 — § 13.3 E2E  
**Date:** 2026-05-07 (body); **verification log updated:** **2026-05-09** (staging pilot PASS)

## Objective

Document **minimum end-to-end flows** required before serious sales and map them to **automated** vs **manual** verification.

## Test tooling

| Layer | Location |
|-------|----------|
| Playwright | `apps/web/tests/e2e` |
| Pilot audit | `bun run audit:pilot` (root), scoped `bun run --cwd apps/web e2e:pilot` |
| CI | `.github/workflows/ci-check.yml` (unit/integration; not full Playwright on every PR unless configured) |
| Staging pilot | `.github/workflows/pilot-e2e-audit.yml` (called from deploy workflows with secrets) |

## Minimum flows (roadmap checklist)

| # | Flow | Automation hint |
|---|------|-----------------|
| 1 | Manager login | Playwright pilot / manual |
| 2 | Create project | API + UI; unit test for limit; E2E recommended |
| 3 | Invite / add worker | invitation flows — E2E or staging script |
| 4 | Worker report with media | mobile/web sync — see mobile docs |
| 5 | Manager approve | approvals UI/API |
| 6 | Create document | documents API |
| 7 | Create estimate | estimates domain |
| 8 | Send estimate to owner | customer estimates |
| 9 | Owner approve estimate | portal |
| 10 | Create decision request | client requests |
| 11 | Owner response | portal |
| 12 | Change order | change orders + customer visibility |
| 13 | Proof pack share | share link + public page |
| 14 | Handover readiness | handover pack service |

## Verification log (local developer run)

**Date:** 2026-05-09 (staging, `PLAYWRIGHT_BASE_URL=https://staging.aistroyka.ai`, `PLAYWRIGHT_SKIP_WEB_SERVER=1`, credentials from `apps/web/.env.local`)

| Command | Result |
|---------|--------|
| `bun run e2e:pilot` / Playwright pilot (`dashboard-button-audit`, `sync-contract`, `core-flow`) | **PASS** — exit **0**; **12** passed, **10** skipped (inventory / preconditions), **0** failed |

**Exact command**

```bash
cd apps/web
set -a && [ -f .env.local ] && . ./.env.local && set +a
export PLAYWRIGHT_SKIP_WEB_SERVER=1
export PLAYWRIGHT_BASE_URL="https://staging.aistroyka.ai"
bun run e2e:pilot
```

---

## Verification log (historical — 2026-05-08 pre-fix FAIL)

**Date:** 2026-05-08 (staging, `PLAYWRIGHT_BASE_URL=https://staging.aistroyka.ai`, `PLAYWRIGHT_SKIP_WEB_SERVER=1`)

| Command | Result |
|---------|--------|
| `bun run test` (repo root) | **PASS** — 263 files, 1401 tests (same day pre-run) |
| `bun run lint` (repo root) | **PASS** |
| Playwright pilot subset (same files as `e2e:pilot`) | **FAIL** — **22** tests scheduled; **9** PASS (`sync-contract.spec.ts` + setup); **1** FAIL `core-flow.spec.ts` (no report signal on project page); **3** FAIL `dashboard-button-audit.spec.ts` (timeouts: `div[aria-hidden=true].absolute.inset-0` intercepts clicks on nav CTAs); **9** skipped (inventory / preconditions). Exit code **1**. |

**Repo fixes after this run (2026-05-08, re-verify on staging)**

1. **`auth.setup.ts`:** persist `localStorage` key `aistroyka:first-launch-guide:v1` before `storageState`, so **FirstLaunchGuide** `Modal` does not block pointer events during inventory-driven CTA clicks.
2. **`core-flow.spec.ts`:** assert on **`/dashboard/daily-reports`** (tenant-wide list) instead of the project detail default tab; widen Russian copy match (`отчет`, `черновик`) for default `E2E_LOCALE=ru`.

**Failure classes (pre-fix)**

1. **core-flow:** Project overview default tab is **Workers**, not Reports; Russian UI did not match `/report|draft/` only; daily-reports is the stable manager-visible surface for new drafts.
2. **dashboard-button-audit:** **FirstLaunchGuide** modal backdrop blocked clicks when `localStorage` was empty in captured `storageState`.

**Exact command (repro)**

```bash
cd apps/web
export PLAYWRIGHT_SKIP_WEB_SERVER=1
export PLAYWRIGHT_BASE_URL="https://staging.aistroyka.ai"
# Credentials: E2E_EMAIL/E2E_PASSWORD or SMOKE_EMAIL/SMOKE_PASSWORD per _helpers/auth.ts
bunx playwright test tests/e2e/dashboard-button-audit.spec.ts tests/e2e/sync-contract.spec.ts tests/e2e/core-flow.spec.ts --config=playwright.config.ts --reporter=list
```

## Verification log (earlier local developer run — credential-blocked)

**Date:** 2026-05-08 (America/Los_Angeles, machine local)

| Command | Result |
|---------|--------|
| `bun run e2e:pilot` (`apps/web`, Playwright with auto `next dev`) | **NOT PASS** — setup failed: missing `E2E_EMAIL` / `E2E_PASSWORD` (or `E2E_USER_*` / `SMOKE_PASSWORD`). **Expected** without `.env` credentials. |

- **Public health (curl):** `GET /api/v1/health` → **200** on staging, apex, and `www` (2026-05-07) — sanity only; **not** E2E or full smoke.

**Exact commands**

```bash
# From repo root after copying .env.pilot.example → .env.pilot and filling auth:
cd apps/web
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"
export E2E_EMAIL="..." E2E_PASSWORD="..."
bun run e2e:pilot
```

Or with auto dev server (slow cold start): omit `PLAYWRIGHT_SKIP_WEB_SERVER` so `playwright.config.ts` can run `bun run dev` unless `CI=1`.

**To reproduce pilot green:** set vars per `apps/web/tests/e2e/_helpers/auth.ts` and `.env.pilot.example`. CI/staging: workflow `pilot-e2e-audit.yml` uses secrets `PILOT_E2E_BASE_URL`, `PILOT_E2E_EMAIL`, `PILOT_E2E_PASSWORD` (optional `PILOT_E2E_PROJECT_ID`).

## Current verdict

- **Staging E2E pilot (2026-05-09):** **PASS** — `e2e:pilot` green against `https://staging.aistroyka.ai` (`12` passed, `10` skipped).
- **Historical (2026-05-08):** **FAIL** before `auth.setup.ts` / `core-flow.spec.ts` fixes; see table above.

## Gaps

- Single **linear** Playwright spec covering the full 1–14 chain may not exist; acceptable if **covered by smaller specs + manual pilot** until consolidated.

## Next action

1. Run `bun run --cwd apps/web e2e:pilot` (or full suite) against `PLAYWRIGHT_BASE_URL`.  
2. Attach trace/output to a dated audit file.  
3. Treat any failure in steps 8–14 as **launch-relevant** (customer-visible paths).
