# Final E2E report (Phase 13)

**Roadmap:** Phase 13 — § 13.3 E2E  
**Date:** 2026-05-07

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

**Date:** 2026-05-08 (America/Los_Angeles, machine local)

| Command | Result |
|---------|--------|
| `bun run test` (repo root: contracts build + `apps/web` Vitest) | **PASS** — 263 files, 1401 tests |
| `bun run lint` (repo root) | **PASS** — no ESLint warnings or errors |
| `bun run e2e:pilot` (`apps/web`, Playwright with auto `next dev`) | **NOT PASS** — setup failed: missing `E2E_EMAIL` / `E2E_PASSWORD` (or `E2E_USER_*` / `SMOKE_PASSWORD`). **Expected** without `.env` credentials. |
| `bun run build` / `bun run cf:build` (root) | **PASS** (2026-05-08); `cf:build` used exported `NEXT_PUBLIC_*` per CI pattern. |

**To reproduce pilot green:** export credentials per `apps/web/tests/e2e/_helpers/auth.ts` and `.env.pilot.example` / `AGENTS.md`, then `bun run --cwd apps/web e2e:pilot` against a reachable `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`). CI/staging: use workflow secrets `PILOT_E2E_*`.

## Current verdict

- **Repository:** E2E **capacity exists** (Playwright + pilot workflows); **unit/lint gates verified green** on 2026-05-08.  
- **Pass/fail:** Full **browser** pilot is **credential-blocked** in the log above; record staging/production results separately in `docs/audit/` (e.g. `LIVE_SMOKE_*.md`) or CI artifacts.

## Gaps

- Single **linear** Playwright spec covering the full 1–14 chain may not exist; acceptable if **covered by smaller specs + manual pilot** until consolidated.

## Next action

1. Run `bun run --cwd apps/web e2e:pilot` (or full suite) against `PLAYWRIGHT_BASE_URL`.  
2. Attach trace/output to a dated audit file.  
3. Treat any failure in steps 8–14 as **launch-relevant** (customer-visible paths).
