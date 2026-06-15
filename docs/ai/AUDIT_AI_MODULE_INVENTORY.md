# AI Module — Full Inventory (Hard Audit)

**Audit date:** 2026-06-04  
**Scope:** Web API (`apps/web`), shared libs, Supabase migrations, smoke/CI, mobile consumers, legacy paths.  
**Method:** Repository scan (routes, services, migrations, tests, docs). No feature work.

---

## Classification legend

| Tag | Meaning |
|-----|---------|
| **ACTIVE** | Used in production path; maintained tests or UI consumers |
| **PARTIAL** | Implemented but incomplete wiring, degraded default, or thin coverage |
| **LEGACY** | Duplicate or deprecated path; kept for compatibility |
| **UNUSED** | No inbound consumer found in repo |
| **UNKNOWN** | Referenced in docs/engine; not verified in `apps/web` runtime |

---

## A. HTTP routes (AI-related)

### Copilot / chat

| Route | Method | File | Class |
|-------|--------|------|-------|
| `/api/v1/projects/:id/copilot` | GET | `apps/web/app/api/v1/projects/[id]/copilot/route.ts` | **ACTIVE** |
| `/api/v1/projects/:id/copilot/chat/stream` | POST (SSE) | `apps/web/app/api/v1/projects/[id]/copilot/chat/stream/route.ts` | **ACTIVE** |

### Construction intelligence (read models)

| Route | Method | File | Class |
|-------|--------|------|-------|
| `/api/v1/projects/:id/intelligence` | GET | `apps/web/app/api/v1/projects/[id]/intelligence/route.ts` | **ACTIVE** |
| `/api/v1/projects/:id/insights` | GET | `apps/web/app/api/v1/projects/[id]/insights/route.ts` | **ACTIVE** |
| `/api/v1/portfolio/summary` | GET | `apps/web/app/api/v1/portfolio/summary/route.ts` | **ACTIVE** |
| `/api/v1/portfolio/control` | GET | `apps/web/app/api/v1/portfolio/control/route.ts` | **ACTIVE** |
| `/api/v1/ai/project-brief` | GET | `apps/web/app/api/v1/ai/project-brief/route.ts` | **ACTIVE** (Phase A orchestrator) |
| `/api/v1/ai/action-plan` | POST | `apps/web/app/api/v1/ai/action-plan/route.ts` | **ACTIVE** (Phase B planner) |

### Vision / media analysis

| Route | Method | File | Class |
|-------|--------|------|-------|
| `/api/v1/ai/analyze-image` | POST | `apps/web/app/api/v1/ai/analyze-image/route.ts` | **ACTIVE** (canonical) |
| `/api/ai/analyze-image` | POST | `apps/web/app/api/ai/analyze-image/route.ts` | **LEGACY** (`setLegacyApiHeaders`) |
| `/api/v1/ai/analyze-video-daily` | POST | `apps/web/app/api/v1/ai/analyze-video-daily/route.ts` | **ACTIVE** |
| `/api/ai/analyze-video-daily` | POST | `apps/web/app/api/ai/analyze-video-daily/route.ts` | **LEGACY** (re-export v1) |
| `/api/v1/ai/transcribe` | POST | `apps/web/app/api/v1/ai/transcribe/route.ts` | **ACTIVE** |
| `/api/ai/transcribe` | POST | `apps/web/app/api/ai/transcribe/route.ts` | **LEGACY** |
| `/api/v1/projects/:id/estimate/from-image` | POST | estimate pipeline | **ACTIVE** (intelligence-adjacent) |
| `/api/v1/projects/:id/ai` | GET | `apps/web/app/api/v1/projects/[id]/ai/route.ts` | **ACTIVE** (job list) |
| `/api/v1/ai/requests` | GET | `apps/web/app/api/v1/ai/requests/route.ts` | **ACTIVE** |
| `/api/v1/ai/requests/:id` | GET | `apps/web/app/api/v1/ai/requests/[id]/route.ts` | **ACTIVE** |
| `/api/v1/reports/:id/analysis-status` | GET | async job status | **ACTIVE** |
| `/api/v1/analysis/process` | POST | job processor | **ACTIVE** (uses `AI_ANALYSIS_URL`) |

### Memory / eval / optimization (AI Brain phases C–E)

| Route | Method | Class |
|-------|--------|-------|
| `/api/v1/ai/memory/context` | GET | **ACTIVE** |
| `/api/v1/ai/memory/record` | POST | **ACTIVE** |
| `/api/v1/ai/feedback` | POST | **ACTIVE** |
| `/api/v1/ai/evals/run` | POST | **PARTIAL** (operator/eval tooling) |
| `/api/v1/ai/evals/report` | GET | **PARTIAL** |
| `/api/v1/ai/improvements` | GET | **PARTIAL** |
| `/api/v1/ai/optimizations/*` | GET/POST | **PARTIAL** (Phase E; not primary product loop) |

### Admin / system / guide

| Route | Class |
|-------|-------|
| `/api/v1/admin/ops/ai-runtime` | **ACTIVE** (tenant admin rollup from `audit_logs`) |
| `/api/v1/admin/ai/usage` | **ACTIVE** |
| `/api/v1/admin/analytics/ai-guide` | **ACTIVE** |
| `/api/v1/admin/analytics/ai-risk` | **ACTIVE** |
| `/api/v1/help/assistant` | **ACTIVE** (in-app guide; not project copilot) |
| `/api/v1/help/assistant/events` | **ACTIVE** |
| `/api/v1/health`, `/api/health` | **ACTIVE** (`aiConfigured`, `openaiConfigured`) |
| `/api/system/health`, `/api/v1/system/health` | **ACTIVE** (`requireSystemRouteAuth` in prod) |
| `/api/system/metrics`, `/api/v1/system/metrics` | **ACTIVE** |

### External / legacy runtime

| Surface | Class |
|---------|-------|
| Supabase Edge `aistroyka-llm-copilot` (`engine/Aistroyk/...`) | **LEGACY** — Playwright mocks; `ai_llm_logs` insert documented there, **not** in `apps/web/supabase/migrations` |
| Public mock UI `/[locale]/copilot` | **LEGACY** / demo (`CopilotMockUI.tsx`) |

---

## B. Core services & libraries

| Module | Path | Class |
|--------|------|-------|
| Copilot orchestration | `apps/web/lib/copilot/*` | **ACTIVE** |
| Context budget | `apps/web/lib/copilot/context-budget.ts` | **ACTIVE** |
| Construction intelligence services | `apps/web/lib/ai-brain/services/*` | **ACTIVE** (deterministic) |
| AI Brain phases A–E | `apps/web/lib/ai-brain/phase-*` | **PARTIAL** (platformization; not all exposed in manager mobile) |
| Vision facade | `apps/web/lib/platform/ai/ai.service.ts` | **ACTIVE** |
| Provider router | `apps/web/lib/platform/ai/providers/provider.router.ts` | **ACTIVE** |
| Policy engine | `apps/web/lib/platform/ai-governance/policy.service.ts` | **ACTIVE** |
| Usage / quota | `apps/web/lib/platform/ai-usage/*` | **ACTIVE** |
| Jobs: `ai_analyze_media`, `ai_analyze_report` | `apps/web/lib/platform/jobs/job.handlers/*` | **ACTIVE** |
| Telemetry | `apps/web/lib/observability/ai-telemetry.ts` | **ACTIVE** |
| Audit (AI runtime) | `apps/web/lib/observability/audit.service.ts` | **ACTIVE** |
| Legacy signature cache | `apps/web/lib/services/aiSignature.ts` | **LEGACY** (`ai_state_cache`, `ai_events`, `ai_risk_scores`) |
| Image normalize/prompts | `apps/web/lib/ai/*` | **ACTIVE** |

---

## C. Database tables (Supabase `apps/web/supabase/migrations`)

| Table | Migration hint | Class |
|-------|----------------|-------|
| `ai_analysis` | `20260411120000_release1_analysis_engine.sql` | **ACTIVE** |
| `ai_usage` | `20260304000100_ai_usage_and_billing.sql` | **ACTIVE** |
| `ai_chat_threads`, `ai_chat_messages` | `20260418143000_ai_chat_stream_tables.sql` | **ACTIVE** (RLS tenant policies) |
| `ai_memory_records` | `20260323120000_ai_memory_records.sql` | **ACTIVE** |
| `ai_run_records`, `ai_feedback_records`, `ai_eval_cases`, `ai_eval_results`, `ai_improvement_candidates` | `20260323130000_ai_eval_learning.sql` | **PARTIAL** |
| `ai_optimization_*` | `20260323140000_ai_optimization_layer.sql` | **PARTIAL** |
| `ai_provider_health` | `20260306540000_ai_provider_health.sql` | **ACTIVE** |
| `ai_policy_decisions` | `20260306450000_ai_policy_decisions.sql` | **ACTIVE** |
| `ai_guide_events` | `20260505235900_ai_guide_events.sql` | **ACTIVE** |
| `audit_logs` | ADR-016 | **ACTIVE** (AI runtime actions) |
| `ai_llm_logs` | — | **UNKNOWN / LEGACY** — referenced in `engine/` and ops docs; **no migration in `apps/web/supabase`** |
| `ai_retrieval_logs`, `ai_security_events`, `ai_slo_daily` | compliance docs | **UNKNOWN** — not found in web migrations |

---

## D. Provider & environment variables

| Variable | Purpose | Class |
|----------|---------|-------|
| `OPENAI_API_KEY` | Vision, copilot stream/non-stream, transcription | **ACTIVE** |
| `OPENAI_VISION_MODEL`, `OPENAI_COPILOT_MODEL`, timeouts/retries | Provider tuning | **ACTIVE** |
| `ANTHROPIC_API_KEY` | Vision fallback | **PARTIAL** |
| `GOOGLE_AI_API_KEY` / `GEMINI_API_KEY` | Gemini vision + video daily | **ACTIVE** (video requires Gemini) |
| `AI_ANALYSIS_URL` | External/in-app analysis URL for jobs | **ACTIVE** (wrangler staging/prod) |
| `AI_VISION_DETERMINISTIC_FALLBACK` | Degraded 200 on vision failure | **ACTIVE** (default on) |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client: quota, policy, usage, stream gate | **ACTIVE** |
| `SYSTEM_API_KEY` | System health/metrics in production | **ACTIVE** |

---

## E. Web & mobile consumers

| Consumer | AI surfaces | Class |
|----------|-------------|-------|
| Dashboard project tab `intelligence` | `GET .../intelligence`, copilot panels | **ACTIVE** |
| `CopilotChatPanel`, `useCopilotThread` | stream + threads | **ACTIVE** |
| `DashboardAIInsightsClient`, intelligence components | intelligence route | **ACTIVE** |
| Portfolio views | `portfolio/summary`, `portfolio/control` | **ACTIVE** |
| iOS Manager `AITabView` | `GET /api/v1/ai/requests` only | **PARTIAL** (copilot/intelligence not wired per `docs/ios-manager/PHASE2_START_AUDIT.md`) |
| iOS Worker | field reports/media; no copilot stream in grep | **PARTIAL** |
| Playwright `apps/web/tests/e2e/ai-smoke.spec.ts` | mocks edge copilot | **PARTIAL** (not live provider) |

---

## F. Tests (AI-focused)

| Area | Location | Class |
|------|----------|-------|
| Copilot routes | `copilot/route.test.ts`, `chat/stream/route.test.ts` | **ACTIVE** |
| Vision | `analyze-image/route.test.ts`, `route.fallback.test.ts`, `ai.service.test.ts` | **ACTIVE** |
| Intelligence services | `missing-evidence`, `top-risks`, `executive-summary-v2`, `project-health-v2` tests | **ACTIVE** |
| Context budget | `context-budget.test.ts` | **ACTIVE** |
| Telemetry | `ai-telemetry.test.ts` | **ACTIVE** (minimal) |
| Provider router / circuit breaker | `provider.router.test.ts`, `circuit-breaker.test.ts` | **ACTIVE** |
| E2E | `tests/e2e/ai-smoke.spec.ts` | **PARTIAL** (mocked LLM edge) |
| Cross-tenant AI routes | — | **UNUSED** (no dedicated suite found) |

---

## G. Documentation map

| Doc | Role |
|-----|------|
| `docs/ai/AI_PLATFORM.md`, `CONSTRUCTION_COPILOT.md`, `VISUAL_AI.md` | Product/engineering reference |
| `docs/ai/CONSTRUCTION_INTELLIGENCE_*` | Intelligence contracts & prior closure |
| `docs/ai/COPILOT_*` | Streaming, cancellation, context standards |
| `apps/web/docs/ai-module.md` | Vision route contract |
| `docs/audit/PHASE9_AI_RUNTIME_REPORT.md` | Prior runtime audit |
| `docs/operations/slo-definition.md` | SLOs reference `ai_llm_logs` (**drift** vs web app) |

---

## H. Known legacy / duplicate paths

1. **`/api/ai/*` vs `/api/v1/ai/*`** — same handlers; legacy sets deprecation headers on analyze-image only.
2. **Edge `aistroyka-llm-copilot`** vs **in-app OpenAI copilot** — dual history; web path is canonical for dashboard.
3. **`aiSignature` tables** vs **`ai-brain` services** — parallel risk/signal models; intelligence route uses ai-brain.
4. ~~**SLO docs `ai_llm_logs` drift**~~ — web canonical telemetry documented in `docs/operations/slo-definition.md` (2026-06-04).
5. **iOS Manager AI** — partial (`GET /api/v1/ai/requests` only); see `docs/ai/IOS_MANAGER_AI_PARITY_MATRIX.md`.

---

## Inventory summary

| Subsystem | Routes | Services | DB | Tests |
|-----------|--------|----------|-----|-------|
| Copilot | 2 ACTIVE | ACTIVE | chat tables ACTIVE | ACTIVE |
| Intelligence | 6+ ACTIVE | ACTIVE deterministic | signals via domain tables | ACTIVE |
| Vision | 4+ ACTIVE | ACTIVE facade | ai_analysis, jobs | ACTIVE |
| Memory/RAG | 2 ACTIVE | ACTIVE store; stream **not wired** | ai_memory_records | PARTIAL |
| Observability | logs + audit | ACTIVE | audit_logs | PARTIAL |
| Phase D–E eval/optimization | 8+ PARTIAL | PARTIAL | PARTIAL | PARTIAL |
