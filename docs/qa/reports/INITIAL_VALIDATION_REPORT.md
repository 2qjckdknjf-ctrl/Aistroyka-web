# AISTROYKA QA Platform — Initial Validation Report

**Date:** 2026-07-03  
**Evidence source:** `https://staging.aistroyka.ai` (live staging, `PLAYWRIGHT_SKIP_WEB_SERVER=1`)  
**Artifact dir:** `docs/qa/artifacts/staging-smoke/`

---

## Staging smoke results (Chrome, public suite)

| Suite | Passed | Failed | Skipped |
|-------|--------|--------|---------|
| Public website (26 routes) | 24 | 2 | 0 |
| Performance | 3 | 0 | 0 |
| Accessibility | 5 | 0 | 0 |
| Security | 11 | 0 | 0 (open-redirect test fixed) |
| **Total (first full run)** | **50** | **4** | **0** |

### Confirmed failures (real product/test findings)

| ID | Test | Finding | Severity |
|----|------|---------|----------|
| F1 | Homepage console monitor | React hydration error #418 in production bundle | P1 |
| F2 | Homepage images | `/brand/aistroyka-icon.png` returns non-loadable asset (naturalWidth=0) | P1 |
| F3 | CTA selector | Test bug (fixed) — invalid Playwright CSS | — |
| F4 | Open redirect probe | Test logic bug (fixed) — `next` param in URL ≠ redirect | — |

---

## Coverage self-audit

| Surface | Total | Referenced in tests | Coverage |
|---------|-------|---------------------|----------|
| Pages | 104 | 72 | **69%** |
| APIs | 287 | 126 | **44%** |
| Vitest unit files | 301 | — | unit layer only |

See `docs/qa/reports/COVERAGE_REPORT.md` for untested route lists.

---

## Final verdicts (evidence-based)

| Verdict | Value | Evidence |
|---------|-------|----------|
| **PUBLIC_SITE_READY** | **NO** | 2 failures: React #418 console error, broken brand icon asset |
| **DASHBOARD_READY** | **UNKNOWN** | No `E2E_EMAIL`/`E2E_PASSWORD` in this run |
| **BACKEND_READY** | **UNKNOWN** | Auth-required network monitor not executed |
| **DATABASE_READY** | **UNKNOWN** | API consistency tests require auth |
| **DESIGN_READY** | **UNKNOWN** | Visual regression baselines not initialized |
| **RESPONSIVE_READY** | **UNKNOWN** | Multi-device matrix not executed in this run |
| **AI_READY** | **UNKNOWN** | Live AI gate (`ai_live_provider.sh`) not run in this session |
| **PERFORMANCE_READY** | **YES** | Homepage load 722ms (< 8s budget); health API 328ms (< 2s) |
| **SECURITY_READY** | **YES** | Sensitive endpoints return 401/403/404; no secret leakage in HTML |
| **ACCESSIBILITY_READY** | **YES** | h1, labels, keyboard tab, alt text checks passed on staging |
| **CI_READY** | **YES** | `qa-platform.yml` added; existing `ci-check.yml` + deploy smokes operational |
| **RELEASE_READY** | **NO** | Public site failures + majority UNKNOWN domains |

### **PROJECT_QUALITY_SCORE = 48/100**

Scoring: YES=full weight, UNKNOWN=30% weight, NO=0. Based on 12-domain rubric in `scripts/qa/generate-reports.mjs`.

---

## P0 issues

None blocking deploy infrastructure. No secret leakage or open sensitive admin endpoints detected.

## P1 issues

1. **React hydration error #418** on public homepage (staging) — investigate SSR/client HTML mismatch.
2. **Broken brand icon** `/brand/aistroyka-icon.png` on homepage — asset path or deploy static file missing.
3. **Dashboard/role E2E unverified** — provision `E2E_EMAIL`/`E2E_PASSWORD` for staging nightly.
4. **AI live gate not in QA platform** — run `bash scripts/smoke/ai_live_provider.sh --require-live` separately.
5. **287 API routes, 56% untested** in Playwright layer (unit tests cover more).

## P2 issues

1. Multi-role credential matrix (`QA_OWNER_*`, `QA_WORKER_*`, `QA_CLIENT_*`) not provisioned.
2. Visual regression snapshots not committed — run with `--update-snapshots` once baselines approved.
3. Foreman not a distinct DB role — maps to admin/member; document in role tests.
4. `pilot-e2e-audit` still optional when GitHub secrets missing.

---

## Recommended fixes (priority order)

1. Fix homepage hydration (#418) and `/brand/aistroyka-icon.png` asset — re-run `bun run qa:public` against staging.
2. Add `PILOT_E2E_*` secrets to GitHub for nightly `qa-platform` full mode.
3. Copy `.env.qa.example` → `.env.qa` with staging pilot credentials.
4. Initialize visual baselines: `cd apps/web && PLAYWRIGHT_BASE_URL=https://staging.aistroyka.ai PLAYWRIGHT_SKIP_WEB_SERVER=1 bunx playwright test --config=playwright.qa.config.ts --update-snapshots tests/qa/08-design-responsive.spec.ts`
5. Wire `ai_live_provider.sh --require-live` into `qa:release` orchestrator as explicit AI_READY gate.

---

## Estimated release readiness

**CONDITIONAL NO-GO for public marketing surface** — staging shows real console and asset defects.  
**CONDITIONAL GO for security headers + sensitive endpoint gates** — evidence from this run.  
**Overall: NOT READY** until PUBLIC_SITE_READY=YES and dashboard/AI credentialed runs complete.

---

## What was built

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | `docs/qa/QA_SYSTEM_INVENTORY.md` | ✅ |
| 2 | `playwright.qa.config.ts` — 10 device projects, HTML/JSON/JUnit reporters | ✅ |
| 3–13 | 11 Playwright spec files under `apps/web/tests/qa/` | ✅ |
| 14 | Multi-device projects in config | ✅ |
| 15 | `scripts/qa/run-qa-platform.sh` release mode | ✅ |
| 16 | `scripts/qa/self-audit.mjs` | ✅ |
| 17 | `.github/workflows/qa-platform.yml` | ✅ |
| 18 | `scripts/qa/generate-reports.mjs` + report artifacts | ✅ |

**Commands:**
```bash
bun run qa:self-audit      # coverage report
bun run qa:public          # CI-safe public tests
bun run qa:platform        # full suite
bun run qa:release         # release gate
```
