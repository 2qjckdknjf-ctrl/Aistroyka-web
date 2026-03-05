# Aistroyka — Technical Dossier (Production-Grade AI System)

**Date:** 2026-03-01  
**Role:** CTO Auditor / AI Architect  
**Rule:** Facts only; references to file:line or path where applicable.

---

## 1) Repository

### 1.1 Directory map (excl. node_modules, build, dist, .git, TestLogs)

| Area | Path | Notes |
|------|------|--------|
| **Frontend (iOS)** | `ios/` | Xcode project `Aistroyka.xcodeproj`; app + AistroykaTests, AistroykaUITests. |
| **Frontend (Web)** | `apps/web/` | Next.js 14, `app/`, `lib/`, `components/`, `middleware.ts`. |
| **Backend / DB** | `engine/Aistroyk/supabase/` | Migrations, Edge functions. Root `supabase/` has only `functions/` (if any). |
| **Edge / Functions** | `engine/Aistroyk/supabase/functions/` | `aistroyka-ai-memory`, `aistroyka-llm-copilot`, `stripe-webhook`. |
| **Migrations** | `engine/Aistroyk/supabase/migrations/` | 45 SQL files, chronological 20250222* … 20260301*. |
| **AI (logic)** | `ios/Aistroyka/Core/AI*`, `Core/AIMemory*`, `Core/AIRecommendations*`, `Core/LLM/` | Decision engines, risk, narrative, LLM client. |
| **AI (Web)** | `apps/web/lib/ai/`, `app/api/ai/` | Prompts, stages, normalize, analyze-image route. |
| **Prompts** | `apps/web/lib/ai/prompts.ts` | Vision system/user prompts. LLM Copilot prompts inline in Edge. |
| **Eval** | — | No dedicated eval/ folder; tests in `*Tests`, `*.test.ts`. |
| **Workers** | `engine/Aistroyk/src/worker/analysisWorker.ts`, `apps/web/lib/ai/runOneJob.ts` | Job dequeue → AI → complete. iOS: `AnalysisJobProcessor`. |
| **Docs/Reports** | `docs/`, `reports/` | Audit, stabilization, step-*.md. |
| **Scripts** | `scripts/` | Env, migrations, seed, CF deploy. |
| **Contracts** | `contracts/` | (if any API contracts). |

**Compact directory tree (key branches only):**
```
.
├── apps/web/          # Next.js frontend
│   ├── app/           # routes, [locale], api (ai, analysis, health, projects, tenant)
│   ├── lib/           # ai, api, auth, supabase
│   └── components/
├── engine/Aistroyk/
│   ├── src/           # ai/, data/, worker/, ui/
│   └── supabase/      # migrations/, functions/ (aistroyka-ai-memory, aistroyka-llm-copilot, stripe-webhook)
├── ios/Aistroyka/     # App, Analysis, Auth, Core (AI, LLM, AIMemory, …), Data, Enterprise
├── docs/              # status/, integration/, qa/
├── contracts/
└── scripts/
```
Full tree: `find . -type d \( -name node_modules -o -name build -o -name dist -o -name .git \) -prune -o -type d -print | sort` (excl. build artifacts).

**Key files (entrypoints):**
- iOS: `ios/Aistroyka/AistroykaApp.swift` (@main) → `AppRootContainerView` → `AppRootView`.
- Web: `apps/web/app/page.tsx`, `app/[locale]/...`, `middleware.ts`.
- Edge: `engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts`, `aistroyka-llm-copilot/index.ts`.

---

## 2) Data model (Supabase / Postgres)

### 2.1 Tables and key columns (tenant_id, project_id, user_id)

| Table | tenant_id | project_id | user_id | Source migration |
|-------|-----------|------------|---------|-------------------|
| projects | ✓ (NOT NULL) | — | — | 20250223300000_multi_tenant_v1.sql |
| tenant_members | ✓ | — | ✓ | 20250226200000_tenant_members_and_invitations.sql |
| project_members | — | ✓ | ✓ | 20260301120000_rls_hardening.sql (new) |
| media | ✓ | ✓ | — | 20250222100000, 20250223300000 |
| analysis_jobs | ✓ | — (via media) | — | 20250222300000, 20250223300000 |
| ai_analysis | ✓ | — (via media) | — | 20250222100000, 20250223300000 |
| project_budget | ✓ | ✓ | — | 20250228210000_product_copilot_domain.sql |
| cost_items | — | ✓ | — | 20250228210000 |
| commitments | — | ✓ | — | 20250228210000 |
| ai_insight_snapshots | ✓ | ✓ | text | 20250228110000_ai_memory_tables.sql |
| ai_llm_summaries | — | — | — | 20250228110000 |
| ai_llm_logs | — | — | text | 20250228100000_ai_llm_logs.sql |
| ai_trust_daily, ai_governance_events, ai_incidents, … | ✓ or user_id (text) | ✓ where applicable | — | 20250228170000 … 20250228200000 |

### 2.2 RLS policies

**Restrictive (tenant + project_members) — after 20260301120000_rls_hardening.sql:**
- **projects:** SELECT/UPDATE/DELETE via `project_members`; INSERT via `tenant_members` for `tenant_id`.  
  Ref: `engine/Aistroyk/supabase/migrations/20260301120000_rls_hardening.sql` lines 61–79.
- **project_budget, cost_items, commitments:** SELECT/INSERT/UPDATE/DELETE via `exists (select 1 from project_members pm where pm.project_id = <table>.project_id and pm.user_id = auth.uid())`.  
  Ref: same file lines 82–130.
- **project_members:** SELECT where `user_id = auth.uid()`; INSERT for self in tenant’s projects; DELETE own.  
  Ref: same file lines 41–58.

**Permissive (`using (true) with check (true)`) — still present:**
- tenant_members, tenant_invitations (20250226200000)
- tenants (20250223300000)
- media, ai_analysis (20250222100000)
- analysis_jobs (20250222300000)
- milestones, tasks, contractors, contractor_contracts, contractor_performance, recommendations, recommendation_feedback (20250228210000)
- regions, region_capacity, job_events, workers, worker_heartbeat, system_capacity, pricing_rules, ai_cost_events, payments, plans, billing_snapshots, usage_events (various migrations)

Ref: grep "Allow all for" / "using (true)" across `engine/Aistroyk/supabase/migrations/`.

### 2.3 Indexes (tenant_id, project_id, project_members)

- **project_members:** `idx_project_members_user_id`, `idx_project_members_project_id` (20260301120000_rls_hardening.sql:12–13).
- **project_budget:** `idx_project_budget_project`, `idx_project_budget_tenant` (20250228210000:16–17).
- **cost_items:** `idx_cost_items_project`, `idx_cost_items_as_of` (20250228210000:33–34).
- **commitments:** `idx_commitments_project`, `idx_commitments_contractor` (20250228210000:51–52).
- **projects:** no dedicated index on tenant_id in initial/multi_tenant; project_members join uses pm.project_id / pm.user_id.

### 2.4 Migrations location and latest

- **Path:** `engine/Aistroyk/supabase/migrations/`.
- **Latest (by prefix):** `20260301120000_rls_hardening.sql` (project_members + RLS for projects, project_budget, cost_items, commitments).
- **Core domain:** `20250222000000_initial_schema.sql` (projects, analyses) → analyses dropped in 20250222100000; `20250223300000_multi_tenant_v1.sql` (tenants, tenant_id on projects/media/jobs); `20250228210000_product_copilot_domain.sql` (project_budget, cost_items, commitments, milestones, tasks, contractors, recommendations).

---

## 3) Multi-tenant security

### 3.1 Proof: tenant A cannot read tenant B

**Policies (after RLS hardening):**
- **projects:** SELECT only if `exists (select 1 from project_members pm where pm.project_id = projects.id and pm.user_id = auth.uid())`.  
  `project_members` is backfilled from `tenant_members`, so a user only has rows for projects in their tenant(s).  
  Ref: `20260301120000_rls_hardening.sql` lines 61–64.
- **project_budget, cost_items, commitments:** Same predicate via `project_id` and `project_members`.  
  Ref: same file 82–130.

**Tests:**
- **RLSValidationTests** (iOS): `test_rls_userB_cannot_read_userA_project`, `_cannot_update_`, `_cannot_delete_`, `test_storage_userB_cannot_access_userA_object`.  
  Ref: `ios/AistroykaTests/Integration/RLSValidationTests.swift` (e.g. 55–75, 79–102, 105–134, 139+).  
  Require two users (A/B); B signs in and attempts read/update/delete of A’s project; test expects deny. With migration applied and A/B in **different tenants**, B has no project_members row for A’s project → RLS denies.
- **Config:** `IntegrationTestConfig.resolveRLS()` requires `SUPABASE_TEST_EMAIL_B`, `SUPABASE_TEST_PASSWORD_B`; if missing, tests **skip** (no fail).  
  Ref: `ios/AistroykaTests/Integration/IntegrationTestConfig.swift` (resolveRLS).

**Edge/backend paths:**
- **fetch_budget_metrics / fetch_schedule_metrics / fetch_contractor_metrics:** Use **user JWT** (Authorization header + `SUPABASE_ANON_KEY`), so RLS applies.  
  Ref: `engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts` (userSupabase from authHeader, 401 when missing).
- **Rest of aistroyka-ai-memory:** Uses **service role** (single client at 575–577), so bypasses RLS for write_snapshot, write_llm_summary, fetch_context_window, etc.

### 3.2 Service role / admin / bypass RLS

| Location | Usage | Risk |
|----------|--------|------|
| `engine/Aistroyk/supabase/functions/aistroyka-ai-memory/index.ts:576` | `SUPABASE_SERVICE_ROLE_KEY` — main client for all actions except fetch_budget_metrics/fetch_schedule_metrics/fetch_contractor_metrics | All other actions (snapshots, summaries, context, incidents, etc.) bypass RLS. |
| `engine/Aistroyk/supabase/functions/aistroyka-llm-copilot/index.ts:282` | `SUPABASE_SERVICE_ROLE_KEY` — cost check (ai_llm_logs), insert logs | Read/write ai_llm_logs without RLS. |
| `engine/Aistroyk/supabase/functions/stripe-webhook/index.ts:55` | `SUPABASE_SERVICE_ROLE_KEY` | Bypass for payment handling. |
| `apps/web/lib/supabase/admin.ts` | `getAdminClient()` using `SUPABASE_SERVICE_ROLE_KEY` | Used only for bucket create (upload route); returns null if key unset. |
| `apps/web/app/api/projects/[id]/upload/route.ts:21–22` | Uses admin client for `createBucket` if needed | Scoped to bucket creation. |
| `apps/web/scripts/seed-supabase-media.mjs:43` | Service key for seed script | Script/ops only. |

Refs: grep "SERVICE_ROLE\|service_role\|getAdminClient" across repo.

---

## 4) AI / LLM layer

### 4.1 Call sites

| Call site | Purpose | File:line |
|-----------|--------|-----------|
| Edge **aistroyka-llm-copilot** | Executive summary, explain risk, chat QA | `engine/Aistroyk/supabase/functions/aistroyka-llm-copilot/index.ts` — OpenAI `chat.completions.create` ~412. |
| Web **analyze-image** | Construction image → stage, completion, risk, issues, recommendations | `apps/web/app/api/ai/analyze-image/route.ts` — fetch to OpenAI vision API ~149, 179. |
| iOS **LLMCopilotService** | Calls Edge aistroyka-llm-copilot (executive summary, explain risk, chat) | `ios/Aistroyka/Core/LLM/LLMCopilotService.swift` — client.invoke; fallback deterministic. |
| iOS **AIMemoryService.recordLLMSummary** | Persists LLM summary via Edge write_llm_summary | `ios/Aistroyka/Core/AIMemory/AIMemoryService.swift` — client.writeLLMSummary. |

### 4.2 Models, parameters, timeouts, retry

- **LLM Copilot (Edge):** Model `gpt-4o-mini` (const MODEL_DEFAULT), `response_format: { type: "json_object" }`, `max_tokens: 600`.  
  Ref: `aistroyka-llm-copilot/index.ts` 16, 412–420.  
  No explicit timeout in snippet; no retry in Edge (client can retry — iOS `LLMCopilotService.invokeWithRetry`).
- **Vision (Web):** Model from `OPENAI_VISION_MODEL` or `gpt-4o`; JSON output.  
  Ref: `apps/web/app/api/ai/analyze-image/route.ts` 25, 149, 179.  
  Retry: in `runOneJob`/route tests (e.g. on 5xx).
- **iOS:** `LLMCopilotService` uses `invokeWithRetry` (retry policy) and fallback to deterministic engines on failure.  
  Ref: `ios/Aistroyka/Core/LLM/LLMCopilotService.swift` 76–84, 85–98.

### 4.3 Abstraction, fallback, structured output

- **Abstraction:** iOS `LLMCopilotClientProtocol` → `LLMCopilotClient` (Edge); Web direct fetch to OpenAI. Edge has deterministic fallback when no key / validation fails / budget exceeded.  
  Ref: `ios/Aistroyka/Core/LLM/LLMCopilotClient.swift`; `aistroyka-llm-copilot/index.ts` 142–180 (deterministicFallback), 352–371 (no api key fallback).
- **Structured output:**  
  - LLM Copilot: `StrictOutput` (summary, key_drivers, recommended_actions, assumptions, tone); validation (no new numbers, length cap); JSON parse + schema check.  
    Ref: `aistroyka-llm-copilot/index.ts` 49–55, 108–138, 424–437.  
  - Vision: JSON with stage, completion_percent, risk_level, detected_issues, recommendations; Web `normalize.ts` for LLM JSON quirks.  
    Ref: `apps/web/lib/ai/prompts.ts`, `apps/web/lib/ai/normalize.ts`, `analyze-image/route.ts`.

### 4.4 Prompt templates

| Location | Content (short) |
|----------|-----------------|
| `apps/web/lib/ai/prompts.ts` | `CONSTRUCTION_VISION_SYSTEM_PROMPT`: expert analyst, JSON only; stage from allowed list, completion_percent 0–100, risk_level low|medium|high, detected_issues, recommendations. `CONSTRUCTION_VISION_USER_MESSAGE`: “Analyze this construction site image…” |
| `engine/Aistroyk/supabase/functions/aistroyka-llm-copilot/index.ts` ~375–413 | System: JSON shape only; no invented numbers; metrics from context; length limits. User: context JSON + optional user question or “Generate executive summary” / “Explain risk”. Optional `historical_context` block (RAG-lite narrative). |

### 4.5 Prompt versioning / registry

- **Version constants:** `CONTEXT_VERSION = "1"`, `PROMPT_VERSION = "1"` in Edge; logged in `ai_llm_logs` (context_version, prompt_version).  
  Ref: `aistroyka-llm-copilot/index.ts` 14–15, 374, insert ai_llm_logs.  
- No separate prompt registry or versioned prompt store; prompts are inline in code.

---

## 5) RAG / Retrieval

- **RAG / vector store:** Not present. No embeddings, pgvector, or chunking in repo (grep: no match for embedding, vector, chunk, pgvector, retrieval).
- **RAG-lite in LLM Copilot:** Optional `historical_context` string (pre-built narrative) passed into the user message for “narrative only; do not cite numbers from it”.  
  Ref: `aistroyka-llm-copilot/index.ts` 408–412.  
- **Isolation:** N/A (no retrieval DB).

---

## 6) Jobs / background processing

### 6.1 Queue / worker for analysis_jobs

- **DB:** `analysis_jobs` (status: pending, processing, completed, failed, …); RPCs `pick_next_analysis_job` / `dequeue_job`, `claim_job_execution`, `complete_analysis_job`.  
  Ref: `engine/Aistroyk/supabase/migrations/20250222800000_pick_next_analysis_job.sql`, 20250223300000 (pick_next_analysis_job with tenant), 20250222400000_complete_analysis_job_rpc.sql, 20250224600000 (worker_id), etc.
- **Workers:**  
  - **engine:** `engine/Aistroyk/src/worker/analysisWorker.ts` — supabase.rpc('pick_next_analysis_job') then AI then complete_analysis_job.  
  - **Web:** `apps/web/lib/ai/runOneJob.ts` — dequeue_job(null, workerId), claim_job_execution, AI, complete_analysis_job.  
  - **iOS:** `ios/Aistroyka/Analysis/Data/AnalysisJobProcessor.swift` — dequeueJob (rpc dequeue_job), fetchMedia, claimJobExecution, callAI (HTTP to aiAnalysisURL), completeJob (rpc complete_analysis_job).

### 6.2 Who creates jobs, who executes

- **Create:** iOS `SupabaseAnalysisRepository.createJob` (insert analysis_jobs), Web/engine `createJob(mediaId, priority)`; RPC `create_analysis_job` used in engine.  
  Ref: `ios/Aistroyka/Analysis/Data/SupabaseAnalysisRepository.swift` 21+; `engine/Aistroyk/src/data/jobs.ts` 14; migrations 20250223500000_atomic_job_creation_rpc.sql.
- **Execute:** analysisWorker (Node), runOneJob (Web), or iOS AnalysisJobProcessor when `AI_ANALYSIS_URL` is set — all call same RPCs and then HTTP to vision API (or internal route).

### 6.3 Retry / idempotency / dead-letter

- **Retry:** Migrations add `retry_count`, `next_retry_at`, status `dead`; retry logic in later migrations.  
  Ref: 20250224700000_retry_engine_v1.sql, 20250222700000_auto_stale_job_sweep.sql.
- **Idempotency:** complete_analysis_job uses execution_token / job state; unique on (media_id) for active job to avoid duplicate create.  
  Ref: 20250222400000_complete_analysis_job_rpc.sql, 20250224800000_idempotent_execution_v1.sql.
- **Dead-letter:** status `dead` and error_type on analysis_jobs.  
  Ref: 20250223000000_enterprise_observability.sql, 20250224700000.

---

## 7) Observability

### 7.1 Logs, tracing, metrics

- **Structured logs:** Edge uses `console.warn` / `console.log` for LLM soft warnings and errors.  
  Ref: `aistroyka-llm-copilot/index.ts` 345, 349.  
  iOS `Logger.debug` / `Logger.error`; no unified structured schema in repo.
- **Tracing:** Migrations add `job_events` (e.g. 20250224900000_observability_tracing_v1.sql); worker heartbeat, observability layer.  
  Ref: migrations 20250222900000, 20250224900000.
- **Metrics:** iOS `NetworkMetrics`, `SLAReporter`, `AppLaunchMetrics`; Web health route returns `ok`, `db`, `aiConfigured`, `openaiConfigured`.  
  Ref: `ios/Aistroyka/Core/DI/AppContainer.swift`; `apps/web/app/api/health/route.ts`.

### 7.2 Token / cost tracking

- **ai_llm_logs:** Every LLM Copilot request logs `tokens_used`, `latency_ms`, `cached`, `validation_passed`, `fallback_used`, `context_version`, `prompt_version`, `model_version`.  
  Ref: `engine/Aistroyk/supabase/migrations/20250228100000_ai_llm_logs.sql`; insert in `aistroyka-llm-copilot/index.ts` 467+.
- **Cost control:** Optional `LLM_MONTHLY_TOKEN_BUDGET`, `LLM_PER_USER_MONTHLY_LIMIT`; when exceeded, Edge returns deterministic fallback and logs with model_version `budget_exceeded` / `user_limit_exceeded`.  
  Ref: `aistroyka-llm-copilot/index.ts` 288–350.

### 7.3 Error taxonomy (LLM)

- **Fallback reasons:** no_api_key, budget_exceeded, user_limit_exceeded, validation failed (disallowed number, length, schema), invalid JSON, empty response.  
  Ref: `aistroyka-llm-copilot/index.ts` (insert ai_llm_logs with model_version string).
- **Analysis jobs:** `error_type` on analysis_jobs (e.g. validation_error, rpc_conflict).  
  Ref: 20250223000000_enterprise_observability.sql; iOS `markJobFailed(..., errorType:)`.

### 7.4 Debug on/off

- **iOS:** Feature flags (e.g. `LLM_COPILOT_ENABLED`, `diagnosticsEnabled`); Debug vs Release in AppContainer.  
  Ref: `ios/Aistroyka/Flags/FeatureFlag.swift`, `AppContainer.swift`, `SettingsView.swift` (diagnostics).
- **Web:** Env-based (e.g. `OPENAI_API_KEY`); health exposes `openaiConfigured`.  
  Ref: `apps/web/app/api/health/route.ts`.

---

## 8) Testing

### 8.1 Unit / integration / e2e

- **iOS:** AistroykaTests (unit + integration), AistroykaUITests. Unit: AIMemoryTests, BudgetEngineTests, ControlModeEngineTests, LLMCopilotServiceTests, etc. Integration: RLSValidationTests, BackendHealthTests, BackendIntegrationTests — require env (Supabase URL, anon key, test users); RLS tests skip when B credentials missing.  
  Ref: `docs/status/STABILIZATION_REPORT.md`, `docs/status/PROJECT_AUDIT_REPORT.md`.
- **Web:** Vitest; 57 tests in 8 files (lib/ai, app/api/ai/analyze-image, analysis/process, health, etc.).  
  Ref: `apps/web` npm run test; PROJECT_AUDIT_REPORT.
- **E2E:** No dedicated e2e suite referenced in dossier; UI tests in iOS only.

### 8.2 LLM eval / golden tests

- **Golden / regression:** Vision output shape tested in Web (e.g. stages, normalize, analyze-image route tests). No dedicated “golden LLM response” or eval suite in repo.  
  Ref: `apps/web/lib/ai/stages.test.ts`, `normalize.test.ts`, `app/api/ai/analyze-image/route.test.ts`.

### 8.3 Current failures (from audit / stabilization)

- **iOS (before stabilization fixes):** 6 unit failures (evolution volatility/delta, self-healing decay, budget impact EN title, control mode source strings); 4 RLS (missing B env); 3 backend (env/network). After stabilization: unit fixes and RLS skip when B missing.  
  Ref: `docs/status/PROJECT_AUDIT_REPORT.md`, `docs/status/STABILIZATION_REPORT.md`.
- **Web:** 57 passed (audit); no failures reported.

---

## 9) Summary

### 9.1 What works (by module)

| Module | Evidence |
|--------|----------|
| **iOS app** | Builds; login → projects → project detail → budget panel / media / analyses; DI via AppContainer; LLM Copilot with fallback. |
| **Web app** | Build + lint + 57 tests pass; dashboard, projects, API routes (health, ai/analyze-image, analysis/process); Supabase auth. |
| **Supabase / DB** | Migrations apply; project_members + RLS for projects, project_budget, cost_items, commitments (20260301120000); rest permissive. |
| **Edge aistroyka-ai-memory** | write_snapshot, write_llm_summary, fetch_context_window, fetch_budget_metrics (with user JWT), etc. |
| **Edge aistroyka-llm-copilot** | Executive summary, explain risk, chat; structured JSON; validation; fallback; ai_llm_logs; token budget. |
| **Analysis pipeline** | createJob (iOS/Web/engine); pick_next/dequeue_job → claim → AI → complete_analysis_job; retry/dead-letter in DB. |

### 9.2 What does not work / gaps (by module)

| Module | Issue |
|--------|--------|
| **RLS** | tenant_members, media, analysis_jobs, ai_analysis, milestones, tasks, contractors, recommendations, and many other tables still permissive; tenant A could in principle read tenant B data where RLS not hardened. |
| **Edge** | Most aistroyka-ai-memory actions use service role (bypass RLS); only budget/schedule/contractor metrics use user JWT. |
| **iOS tests** | Backend/RLS tests depend on env; without env some skip, some fail (backend health/integration). |
| **RAG** | No retrieval pipeline; no embeddings or vector store. |
| **Prompt registry** | No versioned prompt store; prompts in code only. |

### 9.3 P0 / P1 / P2 risks

| Priority | Risk | Location / note |
|----------|------|-------------------|
| **P0** | RLS permissive on media, analysis_jobs, ai_analysis, tenant_members, tenants | Cross-tenant read/write possible until policies tightened. |
| **P0** | Edge aistroyka-ai-memory uses service role for most actions | Snapshot/summary/context/incident paths bypass RLS. |
| **P1** | No RLS on ai_llm_logs | Log table writable by Edge only; no user-scoped read policy. |
| **P1** | Backend/RLS tests require env; CI may fail or skip | IntegrationTestConfig; document and gate. |
| **P2** | Force unwraps / TODO in iOS | Many files; critical paths partially cleaned in stabilization. |
| **P2** | No LLM eval / golden suite | Regression risk on prompt or model changes. |

### 9.4 Recommended roadmap

**2 weeks:**
- **Security:** Extend RLS hardening to media, analysis_jobs, ai_analysis (and optionally tenant_members/tenants) with tenant_id + project_members where applicable. Ref: 20260301120000 pattern.
- **Edge:** Use user JWT (or scoped service) for aistroyka-ai-memory actions that read/write tenant- or project-scoped data (snapshots, context, evolution) so RLS applies.
- **Tests:** Fix or gate remaining iOS unit/backend tests; document env for RLS/backend; ensure CI runs unit-only by default.
- **Docs:** Keep TECHNICAL_DOSSIER and STABILIZATION_REPORT up to date after changes.

**2 months:**
- **RLS:** Full pass on all tables (milestones, tasks, contractors, recommendations, AI tables) with tenant/project membership model.
- **Observability:** Structured logging schema; optional token/cost dashboard from ai_llm_logs.
- **Eval:** Introduce prompt/response versioning and a small LLM eval or golden set for Copilot and vision.
- **Workers:** Harden worker identity and scoping (tenant/region) where applicable; review idempotency and dead-letter handling in production.

---

*End of technical dossier. All references are to current repo state; migration order and line numbers may shift after further changes.*
