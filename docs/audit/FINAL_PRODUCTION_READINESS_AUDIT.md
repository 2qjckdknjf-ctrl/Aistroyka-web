# Final production readiness audit (Phase 13)

**Roadmap:** `docs/roadmap/AISTROYKA_MEGA_ROADMAP_CUSTOMER_FINANCE_SAFE.md` — § Phase 13  
**Date:** 2026-05-07 (updated **2026-05-22** release lock pass)

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
| `bash scripts/verify/stakeholder_finance_sanity.sh` | **PASS** — dedicated stakeholder smoke account verified; role check returns `stakeholder` |
| `gh workflow run release-go-no-go-council.yml` | **PASS** — latest council run `26271634288` successful with stakeholder sanity enabled |

## Council workflow replay (2026-05-21)

| Run | Result | Notes |
|-----|--------|-------|
| `26210496994` | **PASS** | council on `main`, stakeholder sanity disabled (`run_stakeholder_sanity=false`) |
| `26211837253` | **FAIL** | stakeholder sanity enabled, but `STAKEHOLDER_SMOKE_*` secrets absent |
| `26212368552` | **FAIL** | stakeholder sanity received fallback credentials, script failed: `/api/v1/me role=admin`, expected `stakeholder` |
| `26213133876` | **FAIL** | final replay after audit refresh merge: same blocker (`role=admin`, expected `stakeholder`) |
| `26219736831` | **FAIL** | latest replay on `main`: `release:check` passed, stakeholder sanity still fails with fallback account role mismatch (`admin`, expected `stakeholder`) |
| `26226853236` | **FAIL** | replay on `main` confirms blocker persists unchanged: fallback smoke account resolves to `role=admin`, not `stakeholder` |
| `26271634288` | **PASS** | final release-lock replay on `main`: `release:check` + stakeholder finance sanity both pass with dedicated stakeholder account |

Final stakeholder finance live gate: PASS. Dedicated stakeholder smoke account verified. Release GO/NO-GO Council run 26271634288 passed. No security weakening applied. See `docs/security/STAKEHOLDER_SMOKE_ACCOUNT_SETUP_REPORT.md`.

## Verdict

Current baseline remains **GO_PUBLIC_CANDIDATE** for controlled rollout, not broad GA. Final stakeholder gate is now closed; remaining constraints are non-stakeholder items (mobile runtime completeness, AI provider-backed non-fallback proof, and operator/legal signoff surfaces).

## References

- `docs/audit/PHASE13_RELEASE_OPS_REPORT.md`
- `docs/audit/DEEP_PRODUCTION_COMPLETION_VALIDATION_LOG.md` (if present on branch)
- `docs/release/FINAL_RELEASE_CHECKLIST.md`
