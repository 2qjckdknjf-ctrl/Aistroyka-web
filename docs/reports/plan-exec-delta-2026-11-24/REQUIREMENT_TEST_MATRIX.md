# Requirement → test matrix — Codex/Cursor delta 2026-11-24

Verdict enum: `PASS` | `FAIL` | `NOT_RUN` | `UNKNOWN`. Self-reported PASS without SHA/command is rejected.

| ID | Requirement | Test / evidence command | Result | SHA / note |
|---|---|---|---|---|
| D1a | Pre-egress secret detection | `bunx vitest run lib/platform/ai-governance/secret-detection.test.ts policy.service.test.ts` | PASS (pre-merge) | merged #507 `030e089a` |
| D1a-CI | Gitleaks tree/PR-range | `.github/workflows/gitleaks.yml` on #507 | PASS | CI SUCCESS |
| D2a | Provider allowlist | `provider.router.test.ts` | PASS | #507 |
| D2b | Fail-closed fallback | `tenant-ai-preferences.test.ts` | PASS | #507 |
| D2c | X-AI-Fallback-Reason | existing smoke / unchanged | PASS | pre-existing |
| D3a | Retention declaration | `inference-retention.test.ts` + `policy.service` retention cases | NOT_RUN until this PR CI | this branch |
| D3b | Credential resolver scaffold | `resolve-ai-provider-credentials.test.ts` | NOT_RUN until this PR CI | tenant vault still OWNER_GATE |
| D5 | Report GET peer isolation | `app/api/v1/reports/[id]/route.test.ts` | PASS | #507 |
| D6 | Lite allow-list | existing lite tests | PASS | pre-existing |
| D10 | Supplier negatives | `draft-comparison.engine.test.ts` | PASS | #507 |
| D15 | Dependabot config | open Dependabot PRs #509–#517 | PASS (enabled) | do not auto-merge majors |
| Deploy | Staging/prod reflect #507 | `GET /api/v1/health` → `buildStamp.sha7` | PASS | `030e089` staging+prod |

Independent reviewer: non-author APPROVED on #507 (`6262265-cpu`). Production deploy observed via canonical workflow_run (not a local wrangler push).
