# Final production readiness audit (Phase 13)

**Roadmap:** `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md` — § Phase 13  
**Date:** 2026-05-07  
**Scope:** Repository and workflow readiness before serious sales. Live go/no-go still requires operator-run smoke on secured environments.

## 1. CI and build

| Item | Evidence |
|------|-----------|
| PR merge gate | `.github/workflows/ci-check.yml` — `bun install`, `lint`, `bun run test`, Cloudflare/OpenNext bundle with `NEXT_PUBLIC_*` |
| Monorepo build | Root `bun run build` per `AGENTS.md` |

**Status:** **PASS** at repo level. **Verify:** each PR/churn stays green; fix lockfile drift if CI warns.

## 2. Deploy and staging

| Item | Evidence |
|------|-----------|
| Cloudflare Workers | `apps/web/wrangler.toml`, deploy workflows referenced in `docs/audit/PHASE13_RELEASE_OPS_REPORT.md` |
| Env inventory | `docs/ENVIRONMENT-VARIABLES.md` |

**Status:** **CONDITIONAL** — staging/production smoke depends on secrets and operator execution; see release reports.

## 3. Smoke and pilot

| Item | Evidence |
|------|-----------|
| Scripts | `scripts/smoke/pilot_launch.sh`, `apps/web/scripts/smoke-prod.sh`, `bun run audit:pilot` (per `AGENTS.md`) |
| E2E | Playwright under `apps/web/tests/e2e` |

**Status:** **PROCESS READY** — automated proof is environment-dependent.

## 4. Observability (roadmap 13.2)

| Item | Current state |
|------|----------------|
| `request_id` everywhere | **PARTIAL** — confirm middleware/API pattern in critical paths; extend if gaps found in incident review |
| AI runtime logs | governed by copilot/AI routes; see `docs/ai/*` |
| Deploy failure alerting | platform (Cloudflare/GitHub) — operator configuration |
| Error budget | **NOT ESTABLISHED** in repo — product ops decision |

## 5. Release discipline (13.5)

| Step | Notes |
|------|--------|
| CI green | required |
| Staging deploy | workflow exists |
| Pilot smoke | optional/continue-on-error per staging workflow |
| Production + rollback | document in runbooks; not asserted here |

## P0 / P1 register (readiness)

- **P0:** None recorded in this audit for **code location** of blockers; live **credential/regression** P0s only appear during secured runs.
- **P1:** Multi-lockfile inference warnings (noted in `PHASE13_RELEASE_OPS_REPORT.md`); observability/error-budget not fully specified.

## Verification log (2026-05-08)

| Check | Result |
|-------|--------|
| `bun run test` (root) | **PASS** — 1401 Vitest tests |
| `bun run lint` (root → `apps/web`) | **PASS** |
| `bun run build` (root) | **PASS** |
| `bun run cf:build` (root) | **PASS** — local run with `NEXT_PUBLIC_*` set (CI uses repo secrets for anon key) |
| `bun run e2e:pilot` (`apps/web`) | **Skipped / fail** — no `E2E_EMAIL`+`E2E_PASSWORD` in environment (see `FINAL_E2E_REPORT.md`) |

Closure: see **`docs/product/PHASE13_ROADMAP_CLOSURE.md`** (Phase 13 **conditional** until live smoke + credentialed E2E).

## Verdict

**READY FOR HARDENING / PILOT** — repository unit + lint gates verified; **Playwright pilot** requires secured credentials. **Final “production smoke green”** remains operator-recorded after staging/production runs.

## References

- `docs/audit/PHASE13_RELEASE_OPS_REPORT.md`
- `docs/audit/DEEP_PRODUCTION_COMPLETION_VALIDATION_LOG.md` (if present on branch)
- `docs/release/FINAL_RELEASE_CHECKLIST.md`
