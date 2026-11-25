# Requirement → test matrix — Codex/Cursor delta 2026-11-24

Verdict enum: `PASS` | `FAIL` | `NOT_RUN` | `UNKNOWN`. Self-reported PASS without SHA/command is rejected.

| ID | Requirement | Test / evidence command | Result | SHA / note |
|---|---|---|---|---|
| D1a | Pre-egress secret detection | `bunx vitest run lib/platform/ai-governance/secret-detection.test.ts policy.service.test.ts` | PASS (pre-merge) | merged #507 `030e089a` |
| D1a-CI | Gitleaks tree/PR-range | `.github/workflows/gitleaks.yml` on #507 | PASS | CI SUCCESS |
| D2a | Provider allowlist | `provider.router.test.ts` | PASS | #507 |
| D2b | Fail-closed fallback | `tenant-ai-preferences.test.ts` | PASS | #507 |
| D2c | X-AI-Fallback-Reason | existing smoke / unchanged | PASS | pre-existing |
| D3a | Retention declaration | `inference-retention.test.ts` + `policy.service` retention cases | PASS | #518 |
| D3b | Credential resolver wired to providers | `resolve-ai-provider-credentials.test.ts` + provider tests | PASS (local) | tenant vault still OWNER_GATE |
| D4 | Transitive handoff authorization | `transitive-authorization.test.ts` + policy handoff case | PASS (local) | this branch |
| D5 | Report GET peer isolation | `app/api/v1/reports/[id]/route.test.ts` | PASS | #507 |
| D6 | Lite allow-list | existing lite tests | PASS | pre-existing |
| D10 | Supplier negatives | `draft-comparison.engine.test.ts` | PASS | #507 |
| D15 | Dependabot config | open Dependabot PRs #509–#517 | PASS (enabled) | do not auto-merge majors |
| Deploy | Staging/prod reflect #507 | `GET /api/v1/health` → `buildStamp.sha7` | PASS | `030e089` staging+prod |
| GRAPH-004 | Invalidate overlay on non-eligible review | `review.service.test.ts` + `construction-graph.invalidate.test.ts` | PASS | #527 + follow-up tests |
| Smoke cold-start | Health retry after deploy | `scripts/smoke/pilot_launch.sh` | PASS | #528 |
| PILOT-001 unit | Role/RLS/revoke/peer/finance/lite suites | `bunx vitest run` (12 files, see evidence) | PASS (159) | tip `80ff987` / runtime `91ff124` |
| PILOT-001 staging | Completeness templates + recon findings + unknown report | curl staging with SMOKE_* | PASS (200/200/404) | evidence 2026-11-25 |
| Completeness UI | Manager panels hard audit | inventory markdown | CODE_PRESENT | #534 |
| EVID-002/VISION | Persist/review/vision job units | 7 vitest files (50) | PASS | inventory 2026-11-25 |
| AI LIVE gate | `ai_live_provider.sh --require-live` | staging + SMOKE_* | **GO** | vision_router / gpt-4o-mini; no fallback |
| RULE-015 evaluate | POST completeness/evaluate empty inventory | staging SMOKE_* | PASS | verdict INSUFFICIENT_EVIDENCE |
| PILOT multi-persona | synthetic JWT → staging /api/v1 | CF edge | BLOCKED (1010) | Auth OK; API WAF |
| EVID media E2E | upload → analysis/process → ai_analysis | staging SMOKE_* | **PASS** completed | #542 `d84232f` |
| EVID human review | POST /ai/analysis/:id/review (4 verdicts) | staging SMOKE_* | **PASS** | corrections + graph_eligible |
| CLIENT-005A live | POST/GET preproject/extractions + obs review + review-pack | staging SMOKE_* | **PASS** | 201 extract + 200 obs/pack |
| MATERIAL-008 | draft-comparison + requirement-draft units | vitest 14 | PASS | inventory 2026-11-25; staging list 404 |
| MATERIAL-008 live | snapshot→acceptance→draft→fixture→compare→quote | staging SMOKE_* | **PASS** | qty 8.82→need 9.702; ranked offers; YYYY-MM-DD quote |

Independent reviewer: non-author APPROVED on #507 (`6262265-cpu`). Production deploy observed via canonical workflow_run (not a local wrangler push).
