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

Production Worker remains on this SHA (no redeploy in accept-live batch).

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
| Local equivalent | **PASS** — 2 consecutive www+apex pair passes (`09:18:16Z`→`09:18:30Z`) |
| Evidence | `docs/roadmap/evidence/phase8-headers-consecutive-local-2026-08-02.json` |
| CI header-only workflow | `Security Headers Live Smoke` (new; no deploy) |
| CI bounded retry | prod/staging deploy workflows require **2 consecutive** passes (max 8 attempts, 15s sleep) |
| Script | `scripts/smoke/security_headers.sh` supports `SECURITY_HEADERS_*` retry env |

## 7. First 72h (read-only)

| Window | Result |
| --- | --- |
| T+0 | stamps match; RPC present; headers live PASS — `phase8-prod-t0-2026-08-02.json` |
| T+15m | stamps stable; headers PASS — `phase8-prod-t15-2026-08-02.json` |
| Ongoing | read-only monitoring per `docs/release-hardening/FIRST_72H_OPERATIONS_CHECKLIST.md` (window started 2026-08-02) |
| Rollback | remains **NOT_GRANTED** |

## 8. Verdicts

| Verdict | Value |
| --- | --- |
| Production Worker at proven SHA | **YES** |
| Header consecutive recheck (local equivalent) | **YES** |
| Header CI live smoke | *(filled after workflow)* |
| Runtime parity stg+prod | **YES** (`8408ca26…`) |
| Overall Phase 8 | *(YES only after CI header smoke success)* |
| Safe to proceed to Phase 9 | **NO** until Overall = YES |

## 9. Actions confirmation

| Action | Status |
| --- | --- |
| keep prod on `8408ca26…` | yes |
| header-only retry (no redeploy) | executed (local); CI pending/recorded below |
| CI bounded retry added | yes (workflows + script) |
| first-72h read-only | started |
| rollback | not executed |
| Phase 9 | not started |
