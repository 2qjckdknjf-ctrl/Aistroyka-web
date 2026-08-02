# Phase 8 Release Execution — 2026-08-02

## 1. Authorization scope

| Variable | Value | Effect |
| --- | --- | --- |
| `PHASE8_COMMIT_PUSH_MIGRATION_STAGING_AUTHORIZATION` | **GRANTED** | Commit / push / migration / staging |
| `PHASE8_ORDERED_MIGRATIONS_AUTHORIZATION` | **GRANTED** | Both pending migrations applied |
| `PHASE8_PRODUCTION_DEPLOY_AUTHORIZATION` | **GRANTED** | Production deploy of staging-proven SHA |
| `PHASE8_ACCEPT_LIVE_RECHECK_AND_CONTINUE_72H_AUTHORIZATION` | **GRANTED** | Keep prod on SHA; header-only retry; CI bounded retry; first-72h |
| `PHASE8_FAILED_SMOKE_ROLLBACK_AUTHORIZATION` | **NOT_GRANTED** | Rollback forbidden |

## 2. Immutable SHA (staging proven → production live)

`8408ca26c3db1a88cd5166c9dc86458ec630bf4d`  
Tag pin: `phase8-staging-proven-8408ca26`

Production Worker remains on this SHA (**no redeploy** in accept-live batch).

CI hardening commit (script/workflows/docs only; not deployed): `dedef02abf2b0bf6ca2bc75a1de60369344ee29e`

## 3. Migrations

Applied via MCP in order; staging/prod shared DB `rateLimitRpcStatus=present`; `PHASE8_VERIFY:*` residue 0.

## 4. Staging

[Deploy Cloudflare (Staging) #30739922707](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/30739922707) — **success** @ `8408ca26…`

## 5. Production deploy

| Item | Result |
| --- | --- |
| Workflow | [Deploy Cloudflare (Production) #30740413032](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/30740413032) |
| Overall conclusion | **failure** (CI security headers job; propagation race) |
| Deploy job | **success** — Worker live at `8408ca26…` |
| Pilot smoke / stakeholder finance | **success** |
| apex/www buildStamp | **MATCH** `8408ca26…` (`buildTime=2026-08-02 08:46`) |
| Rollback | **not executed** |

## 6. Accept live recheck + header retry (no redeploy)

| Item | Result |
| --- | --- |
| Decision | **A** — do not rollback |
| Local/CI-equivalent | **PASS** — **2 consecutive** www+apex pair passes (`09:18:16Z`→`09:18:30Z`) |
| Evidence | `docs/roadmap/evidence/phase8-headers-consecutive-local-2026-08-02.json` |
| Prod stamps during recheck | both hosts still `8408ca26…` |
| Script | `scripts/smoke/security_headers.sh` — `SECURITY_HEADERS_MAX_ATTEMPTS` / `REQUIRE_CONSECUTIVE` / `RETRY_SLEEP_SEC` |
| Staging deploy workflow | requires **2 consecutive** header passes |
| Prod deploy workflow | requires **2 consecutive** www+apex pair passes (max 8, 15s) |
| Header-only GHA workflow | PR [#204](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/204) `ci/security-headers-live-smoke` → `main` (merge with `[skip-staging-deploy]`) |

## 7. First 72h (read-only)

| Window | Result |
| --- | --- |
| T+0 | stamps match; RPC present; headers live PASS — `phase8-prod-t0-2026-08-02.json` |
| T+15m | stamps stable; headers PASS — `phase8-prod-t15-2026-08-02.json` |
| Continue | `phase8-first72h-continue-2026-08-02.json` |
| Checklist | `docs/release-hardening/FIRST_72H_OPERATIONS_CHECKLIST.md` — window started 2026-08-02 |
| Rollback | remains **NOT_GRANTED** |

## 8. Verdicts

| Verdict | Value |
| --- | --- |
| Production Worker at proven SHA | **YES** |
| Header consecutive recheck (CI-equivalent) | **YES** (2 consecutive pair PASS; no redeploy) |
| Runtime parity stg+prod | **YES** (`8408ca26…`) |
| Migration RPC parity | **YES** |
| Overall Phase 8 | **YES** |
| Safe to proceed to Phase 9 | **NO** — Phase 9 not started / not authorized in this batch |

## 9. Closure note

| Field | Value |
| --- | --- |
| Files changed (accept-live) | `scripts/smoke/security_headers.sh`, deploy staging/prod workflows, `security-headers-live.yml`, contract test, Phase 8 docs/evidence, FIRST_72H note |
| Checks run | local 2× consecutive headers PASS; vitest deploy-workflow contract **7/7**; prod stamps confirm `8408ca26…` |
| Result | Phase 8 closed **YES**; prod left on proven SHA; rollback not used |
| Remaining follow-ups | Land `security-headers-live.yml` on `main` via controlled PR (avoid unintended staging deploy); continue T+1h…T+72h read-only checks |
| Phase 9 | **NO** |

## 10. Actions confirmation

| Action | Status |
| --- | --- |
| keep prod on `8408ca26…` | **yes** |
| header-only retry (no redeploy) | **executed** (2 consecutive PASS) |
| CI bounded retry added | **yes** (on release branch) |
| first-72h read-only | **started / continuing** |
| rollback | **not executed** |
| Phase 9 | **not started** |
