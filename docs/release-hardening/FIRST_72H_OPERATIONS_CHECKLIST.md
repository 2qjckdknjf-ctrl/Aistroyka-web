# First 72 Hours Operations Checklist (AISTROYKA)

**Canonical runtime:** Cloudflare Workers + OpenNext (`aistroyka.ai` / `staging.aistroyka.ai`).
**Vercel is not production proof.**
**Observation window status (Phase 8, 2026-08-02):** started after production Worker live at `8408ca26…` (T+0 / T+15m evidence under `docs/roadmap/evidence/phase8-prod-t*.json`). Remaining T+1h…T+72h checks are **read-only** monitoring; rollback remains owner-gated (`PHASE8_FAILED_SMOKE_ROLLBACK_AUTHORIZATION` NOT_GRANTED).

Owner-policy thresholds marked `owner policy required` must be filled by product owner / incident commander before GO.

## Roles

| Role | Responsibility |
| --- | --- |
| on-call engineer | Execute checks, capture evidence, first response |
| incident commander | Freeze deploys, choose rollback vs fix-forward |
| product owner | Customer/comms decisions, GO/NO-GO |
| database operator | Migration apply / schema compatibility (owner-authorized only) |

## Pre-deploy

| Signal | Expected | Threshold | Evidence | Role | Escalation |
| --- | --- | --- | --- | --- | --- |
| Immutable Git SHA selected | Full 40-char SHA from reviewed commit (not dirty fingerprint) | exact SHA known | GitHub commit / PR | on-call engineer | Stop if dirty tree / unknown SHA |
| Staging deploy of that SHA | workflow success | conclusion=success | Actions: Deploy Cloudflare (Staging) | on-call engineer | No production |
| Staging `buildStamp.sha7` | matches deploy SHA7 | exact match | `GET https://staging.aistroyka.ai/api/v1/health` | on-call engineer | Rollback staging / freeze |
| Staging security headers | smoke PASS | script exit 0 | `bash scripts/smoke/security_headers.sh https://staging.aistroyka.ai` | on-call engineer | Freeze |
| Migration parity | critical RPC present after authorized apply | `rate_limit_try_increment_multi` PRESENT | `scripts/release/check-migration-parity.sh` + RPC probe | database operator | Do not claim paid AI LIVE |
| Production approval | explicit owner approval recorded | present | ops channel / ticket | product owner | No production |

## T+0 (production cutover)

| Signal | Expected | Threshold | Evidence | Role | Escalation |
| --- | --- | --- | --- | --- | --- |
| Production deploy | workflow success for same SHA as staging | same SHA7 | Actions: Deploy Cloudflare (Production) | on-call engineer | Rollback to last-known-good |
| Apex health | 200, `ok:true`, `env:production`, buildStamp present | `buildStamp.sha7` == deploy | `curl -fsS https://aistroyka.ai/api/v1/health` | on-call engineer | Rollback |
| WWW health | same stamp as apex | exact match | `curl -fsS https://www.aistroyka.ai/api/v1/health` | on-call engineer | Rollback |
| Security headers apex+www | PASS | exit 0 | `bash scripts/smoke/security_headers.sh https://aistroyka.ai` and `…/www…` | on-call engineer | Rollback if weakened/duplicate |

## T+15m

| Signal | Expected | Threshold | Evidence | Role | Escalation |
| --- | --- | --- | --- | --- | --- |
| Auth/login | login page + password grant path reachable | no 5xx storm | browser or smoke credentials | on-call engineer | Incident if auth broken |
| API health | stable 200 | no consecutive 5xx > owner policy required | Worker metrics / health curls | on-call engineer | Rollback consideration |
| Rate-limit RPC | `rateLimitRpcStatus` not silently green when missing | `present` or explicit `degraded` | health JSON | on-call engineer | Keep AI degraded label |
| AI mode | LIVE only if product `--require-live` green; else beta/degraded | honest claims | Phase 7 gate + health | on-call engineer | Do not claim LIVE falsely |

## T+1h

| Signal | Expected | Threshold | Evidence | Role | Escalation |
| --- | --- | --- | --- | --- | --- |
| 5xx rate | within owner policy | owner policy required | Cloudflare analytics | incident commander | Rollback if breach |
| Latency p95 | within owner policy | owner policy required | Cloudflare / app metrics | on-call engineer | Investigate |
| Tenant isolation | no cross-tenant incidents | zero known leaks | support + logs (redacted) | on-call engineer | P0 |
| Mobile endpoints | lite allow-list still fail-closed | 403 outside list | smoke / contract tests already in CI | on-call engineer | Patch-forward or rollback |

## T+6h

| Signal | Expected | Threshold | Evidence | Role | Escalation |
| --- | --- | --- | --- | --- | --- |
| Uploads / media | no stuck session growth beyond owner policy | owner policy required | admin jobs / upload sessions | on-call engineer | Pause uploads if cascading |
| Queue / outbox | failed/dead not accelerating | owner policy required | `/api/v1/admin/jobs` (auth) | on-call engineer | Incident |
| Database | reachable; no migration drift surprise | health db=ok | health + migration ledger | database operator | Freeze deploys |

## T+24h / T+48h / T+72h

Repeat T+1h and T+6h signals; additionally:

| Signal | Expected | Threshold | Evidence | Role | Escalation |
| --- | --- | --- | --- | --- | --- |
| buildStamp still matches intended SHA | unchanged unless intentional redeploy | exact | health apex+www+staging | on-call engineer | Investigate drift |
| AI fallback rate | not silently rising while labeled LIVE | owner policy required | AI telemetry / admin AI runtime | on-call engineer | Relabel degraded |
| Rollback readiness | last-known-good SHA still deployable | artifact/source available | rollback rehearsal doc | incident commander | Document gap |

## Smoke commands (sanitized)

```bash
curl -fsS https://staging.aistroyka.ai/api/v1/health
curl -fsS https://aistroyka.ai/api/v1/health
curl -fsS https://www.aistroyka.ai/api/v1/health
bash scripts/smoke/security_headers.sh https://staging.aistroyka.ai
bash scripts/smoke/security_headers.sh https://www.aistroyka.ai
bash scripts/smoke/security_headers.sh https://aistroyka.ai
# Paid AI live proof (only with controlled IMAGE_URL + auth; not for random traffic):
# BASE_URL=https://staging.aistroyka.ai IMAGE_URL=... bash scripts/smoke/ai_live_provider.sh --require-live
```

## Rollback triggers (decision, not auto-execute)

- Health `ok:false` or missing production `buildStamp` after deploy verification window.
- Auth broken for multiple users.
- Suspected data corruption / tenant isolation failure.
- Error rate above **owner policy required** for sustained period (fill before GO).
- Security headers weakened or duplicated on apex/www.

Execute rollback only via owner-authorized procedure in `docs/roadmap/AISTROYKA_PHASE8_ROLLBACK_REHEARSAL_2026-07-30.md` and `docs/release/PHASE3_ROLLBACK_RUNBOOK.md` (note: staging trigger is `main`, not `develop`).

## Incident priorities

1. **P0:** Site down; auth broken; tenant isolation failure; data loss.
2. **P1:** Jobs/outbox stuck; uploads failing; paid AI incorrectly claimed LIVE.
3. **P2:** Single-tenant degradation; elevated latency.
4. **P3:** Cosmetic / i18n.

## Final publication checkpoint

Use `docs/release-hardening/GO_NO_GO_COUNCIL_CHECKLIST.md` before broad GA claims.
Do not claim production GA without current `buildStamp` + staging-before-prod provenance + migration parity for critical RPCs.
