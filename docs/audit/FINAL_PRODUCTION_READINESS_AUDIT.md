# Final production readiness audit (Phase 13)

**Roadmap:** `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md` — § Phase 13  
**Date:** 2026-05-07 (updated **2026-05-21** hardening pass)

**Scope:** Repository and workflow readiness before serious sales. Live go/no-go still requires operator-run smoke on secured environments.

## 1. CI and build

| Item | Evidence |
|------|-----------|
| PR merge gate | `.github/workflows/ci-check.yml` — `bun install`, `lint`, `bun run test`, Cloudflare/OpenNext bundle with `NEXT_PUBLIC_*` |
| Monorepo build | Root `bun run build` per `AGENTS.md` |

**Status:** **PASS** at repo level. CI now includes `release:check` policy gate in addition to lint/test/build checks.

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

**Status:** **Green for scripted smoke (2026-05-08)** — full `pilot_launch.sh` **PASS** on staging and production with tenant auth. **E2E** still **FAIL** on subset (`FINAL_E2E_REPORT.md`).

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
| Pilot smoke | blocking in deploy pipelines |
| Production + rollback | document in runbooks; not asserted here |

Go/no-go council checklist: `docs/release-hardening/GO_NO_GO_COUNCIL_CHECKLIST.md`  
Workflow assist: `.github/workflows/release-go-no-go-council.yml`

## P0 / P1 register (readiness)

- **P0:** None recorded in this audit for **code location** of blockers; live **credential/regression** P0s only appear during secured runs.
- **P1:** Multi-lockfile inference warnings (noted in `PHASE13_RELEASE_OPS_REPORT.md`); observability/error-budget not fully specified.

## Verification log (2026-05-08 live sprint)

| Check | Result |
|-------|--------|
| `bun run test` (root) | **PASS** — 1401 tests |
| `bun run lint` | **PASS** |
| `bun run build` / `bun run cf:build` | **PASS** |
| `pilot_launch.sh` staging (auth) | **PASS** |
| `pilot_launch.sh` production (auth) | **PASS** |
| `GET /api/v1/health` staging + prod | **200** |
| Playwright pilot (staging) | **FAIL** |
| `supabase projects list` | **BLOCKED** — Unauthorized |

**Phase 13 closure:** **CONDITIONAL** (`PHASE13_ROADMAP_CLOSURE.md`) until E2E + Supabase CLI + optional live customer sanity.

## Latest preflight (2026-05-21)

| Check | Result |
|-------|--------|
| `bun run lint` | **PASS** |
| `bun run test` | **PASS** — 1452 tests |
| `bun run cf:build` | **PASS** |
| `bun run release:check` | **PASS_WITH_WARNINGS** |
| `bun run smoke:pilot:check --strict` | **FAIL (env blocked)** — missing auth path for `ops/metrics`, E2E creds, and `SUPABASE_ACCESS_TOKEN` |
| `bash scripts/verify/stakeholder_finance_sanity.sh` | **BLOCKED** — missing `STAKEHOLDER_SMOKE_EMAIL` / `STAKEHOLDER_SMOKE_PASSWORD` |
| `gh workflow run release-go-no-go-council.yml` | **BLOCKED** — workflow not yet present on default branch (local-only until push/merge) |

## Verdict

Current baseline remains **GO_PUBLIC_CANDIDATE** for controlled rollout, not broad GA. Final publication decision requires a fresh council run on the target SHA and updated live evidence.

## References

- `docs/audit/PHASE13_RELEASE_OPS_REPORT.md`
- `docs/audit/DEEP_PRODUCTION_COMPLETION_VALIDATION_LOG.md` (if present on branch)
- `docs/release/FINAL_RELEASE_CHECKLIST.md`
