# Phase 3 — AI Platform Report

**Project:** AISTROYKA  
**Phase:** AI Platform (multi-provider, routing, governance, observability, construction brain alignment).  
**Scope:** Platform-level AI hardening and documentation. No UI features. No product expansion.

**Status:** Complete.

---

## Non-negotiables (verified per stage)

1. `/api/v1/ai/analyze-image` request/response shapes and status codes unchanged.
2. Phase 1–2 preserved: AIService single entry; Lite allow-list; Lite idempotency; admin security; billing; legacy wrappers.
3. AIService remains single façade for sync routes and async jobs.
4. All provider calls via Provider Router + circuit breaker; no direct vendor fetch.
5. Policy Engine invoked for all AI requests (sync + async); decisions audited.
6. Production routing: provider/model selection, fallback, per-tenant overrides.
7. Cost governance: quotas + budgets, per-tenant caps, alert hooks.
8. Observability: structured logs, audit events, provider health, trace correlation.
9. After each stage: unit tests + build + cf:build.
10. End state: this report + ADR for routing/governance.

---

## Stage 0 — Audit (completed)

### 0.1 Locations

| Component | Path | Notes |
| ----------- | ------ | -------- |
| AIService | `apps/web/lib/platform/ai/ai.service.ts` | Single entry: `analyzeImage(admin, ctx, input)` |
| Provider Router | `apps/web/lib/platform/ai/providers/provider.router.ts` | Uses OpenAI + Anthropic stub + Gemini stub; circuit breaker integrated |
| Providers | `provider.openai.ts` (real), `provider.anthropic.stub.ts`, `provider.gemini.stub.ts` | Stubs are **empty files** — exports missing; build may fail until Stage 1 |
| Provider interface | `apps/web/lib/platform/ai/providers/provider.interface.ts` | `VisionResult`, `VisionOptions`, `AIProvider` |
| Circuit breaker | `apps/web/lib/platform/ai/providers/circuit-breaker.ts` | `getCircuitState`, `recordSuccess`, `recordFailure`, `canInvoke`; persists to `ai_provider_health` |
| Policy Engine | `apps/web/lib/platform/ai-governance/policy.service.ts` | `runPolicy`, `recordPolicyDecision` → `ai_policy_decisions` |
| Policy rules | `apps/web/lib/platform/ai-governance/policy.rules.ts` | Tier/image count/size; returns allow/block/degrade |
| Usage service | `apps/web/lib/platform/ai-usage/ai-usage.service.ts` | `checkQuota`, `recordUsage`, `estimateVisionCostUsd` |
| Usage repo | `apps/web/lib/platform/ai-usage/ai-usage.repository.ts` | `ai_usage`, `tenant_billing_state`, getSpentForPeriod, addSpent |
| Cost estimator | `apps/web/lib/platform/ai-usage/cost-estimator.ts` | OpenAI models only (`gpt-4o`, `gpt-4o-mini`) |
| Tables | Migrations | `ai_provider_health` (20260308300000), `ai_policy_decisions` (20260307300000 / 20260307400000) |

### 0.2 Flow confirmation (Phase 1)

- **Route** `POST /api/ai/analyze-image`: validates body, rate limit, **checkQuota** (in route), then `analyzeImage(admin, ctx, { imageUrl, ... })`.
- **AIService.analyzeImage**: when `ctx.tenantId` → **runPolicy** (evaluate + record to `ai_policy_decisions`); if block → throw `AIPolicyBlockedError`; then **invokeVisionWithRouter**; then normalize; then **recordUsage** (when tenantId).
- **Router**: `providersForTier(tier)` returns all three providers; for each, `canInvoke(supabase, provider.name)` → invoke → `recordSuccess` or `recordFailure`.
- **Gaps identified:**
  - **Quota**: Checked in route only; not in AIService. Job handler does not check quota before calling `analyzeImage` (acceptable if jobs are tenant-scoped and quota enforced at enqueue or route level).
  - **Policy**: Decision recorded with `tenant_id`, `trace_id`, `decision`, `rule_hits`; no `decisionId` or `policyVersion` in schema yet.
  - **Router**: No tenant preference source; no model tier mapping; no retryable vs non-retryable; Anthropic/Gemini stubs empty (no-op or broken imports).
  - **Budget**: Only monthly quota via `getLimitsForTenant` + `tenant_billing_state`; no daily budget, no soft/hard, no alert hooks.
  - **Observability**: Route logs `ai_analyze_image` with status/duration/trace/tenant; no provider/model/cost in log; no metrics; circuit state in DB but no dedicated admin health endpoint mentioned.
  - **Cost estimator**: Only OpenAI; need Anthropic/Gemini for Stage 1.

### 0.3 Report skeleton — stage placeholders

- **Stage 1:** Provider interfaces + real providers (Anthropic, Gemini) — *pending*
- **Stage 2:** Router: model + provider routing, fallback, tenant overrides — *pending*
- **Stage 3:** Policy Engine: consistent decisions + audit trail — *pending*
- **Stage 4:** Cost governance: budgets + alert hooks — *pending*
- **Stage 5:** Observability: metrics, logs, trace correlation — *pending*
- **Stage 6:** Construction brain alignment (ADR + docs, re-exports) — *pending*
- **Stage 7:** Final verification & report — *pending*

---

## Stage 1 — Provider interfaces + real providers (done)

- **Provider interface:** `invokeVision(imageUrl, options?)` → `VisionResult | null`; consistent errors via `ProviderRequestError` (timeout, rate_limit, auth, invalid_input, server_error) and `ProviderUnavailableError`; `isRetryableProviderError()` for router.
- **Anthropic:** `provider.anthropic.ts` — `ANTHROPIC_API_KEY`, `ANTHROPIC_VISION_MODEL` (default `claude-sonnet-4-20250514`), Messages API with image URL, timeout 85s, response mapped to `VisionResult`. Missing key → returns null.
- **Gemini:** `provider.gemini.ts` — `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY`, `GEMINI_VISION_MODEL` (default `gemini-1.5-flash`), fetches image then `generateContent` with inline_data, timeout 85s. Missing key → returns null.
- **Router:** Uses real providers; on failure calls `recordFailure` and continues only if `isRetryableProviderError(err)` (stops on invalid_input/auth).
- **Cost estimator:** Anthropic and Gemini model prices added; `getPricePer1k(model)` for claude-*/ gemini-* fallbacks.
- **Route:** 503 when `!isAnyVisionProviderConfigured()` (any of OpenAI/Anthropic/Gemini key set).
- **Tests:** provider.anthropic.test.ts, provider.gemini.test.ts, provider.errors.test.ts; route test updated for 503 message.

---

## Stage 2 — Router: model + provider routing, fallback, tenant overrides (done)

- **Source of truth:** `tenant_feature_flags`: `ai_provider_preference` (variant: openai|anthropic|gemini), `ai_model_tier` (variant: low|standard|high), `ai_fallback_enabled` (enabled: boolean).
- **routing/models.ts:** `ModelTier` → provider model names (e.g. low→gpt-4o-mini, standard→gpt-4o); `modelForProviderAndTier(provider, tier)`.
- **routing/tenant-ai-preferences.ts:** `getTenantAIPreferences(supabase, tenantId)` reads flags, returns `{ providerPreference?, modelTier?, fallbackEnabled }`.
- **Router:** Loads preferences; `orderProviders(preference, fallbackEnabled)` puts preferred first, then rest (or preferred only if fallback disabled); resolves model per provider from tier; passes `tenantId`/`requestId` from AIService; circuit breaker + retryable logic unchanged.
- **Tests:** provider.router.test.ts — default order, tenant preference + fallback, circuit breaker skip, all fail, model tier passed.

---

## Stage 3 — Policy Engine: decisions + audit trail (done)

- **Decision shape:** `PolicyResult` includes `decisionId` (from `ai_policy_decisions.id`); `recordPolicyDecision` returns inserted id.
- **Audit:** Every `runPolicy` call persists to `ai_policy_decisions` (tenant_id, trace_id, decision, rule_hits).
- **PII hook:** When `privacy_settings.pii_mode === "strict"` and `image_url` is set, allow only hosts in `AI_TRUSTED_IMAGE_HOSTS` (comma-separated); else block with rule_hit `pii_strict_untrusted_image_host` or `pii_strict_invalid_image_url`.
- **AIService:** Passes `image_url` in policy context; on deny throws `AIPolicyBlockedError`; route returns 403 with `code: "ai_policy_denied"`.
- **Tests:** policy.service.test.ts (allow/block, decisionId, PII strict trusted/untrusted host, recordPolicyDecision).

---

## Stage 4 — Cost governance: budgets + alerts (done)

- **Hard cap:** Existing `checkQuota` uses `monthly_ai_budget_usd` (tier limits); on exceed returns 402 with **code "ai_budget_exceeded"** and creates alert type **ai_budget_exceeded** (critical).
- **Soft alert:** `checkBudgetAlert(supabase, tenantId, estimatedCostUsd)` — when usage crosses 80% of monthly budget, creates alert type **ai_budget_soft_exceeded** (warn). Called from analyze-image route after checkQuota when allowed.
- **Alert types:** Extended `AlertType` in `lib/sre/alert.service.ts` with `ai_budget_soft_exceeded`, `ai_budget_exceeded`.
- **Tests:** ai-usage.service.test.ts updated (mock createAlert; expect message to contain "budget"; checkBudgetAlert under threshold).

---

## Stage 5 — Observability (done)

- **Structured logging:** AIService logs one structured event per successful AI call: `event="ai.invoke"`, `tenantId`, `userId`, `traceId`, `providerSelected`, `modelSelected`, `latencyMs`, `costEstUsd`, `tokensIn`, `tokensOut`, `policyDecisionId`, `outcome`, `ts`. No PII; no image URLs. Skipped when `NODE_ENV=test`.
- **Provider health:** Circuit breaker already writes to `ai_provider_health`; `canInvoke`/`recordSuccess`/`recordFailure` used by router. Queryable by admin (existing policies).
- **Metrics:** No in-process counters/histograms in this codebase; metrics.service queries tenant_daily_metrics/ai_usage for dashboards. Structured logs provide the data for future metric pipelines (e.g. log-based metrics in Cloudflare).

---

## Stage 6 — Construction brain alignment (done)

- **ADR:** `docs/ADR/067-ai-platform-routing-governance.md` — router/policy design, provider selection, model tiers, budget strategy, observability.
- **Construction brain:** `apps/web/lib/ai/construction-brain/index.ts` — re-exports prompts, normalize (parseJsonFromContent, normalizeStage, sanitizeAnalysisResult, ALLOWED_STAGES), types (AnalysisResult, RiskLevel), riskCalibration. No file moves.
- **Docs:** `docs/ai/AI_PLATFORM.md` — entrypoints, flow, env vars, tenant preferences, budgets/alerts, observability, troubleshooting.

---

## Stage 7 — Final verification & report (done)

- **Verification:** `npm install --legacy-peer-deps`, `npm test --run` (246 tests), `npm run build`, `npm run cf:build` — all passed.
- **Type fixes:** policy.service (piiResult.rule_hit fallback), ai.service (traceId/userId null coalesce for log payload).

---

## Summary

| Stage | Deliverable |
| ----- | ----------- |  
| 0 | Audit; report skeleton |
| 1 | Anthropic + Gemini real providers; provider.errors; cost estimator; route 503 from any provider |
| 2 | Router: tenant preferences, model tier mapping, fallback, circuit breaker; routing tests |
| 3 | Policy: decisionId, audit, PII strict hook; 403 code ai_policy_denied |
| 4 | Budget: 402 ai_budget_exceeded; soft alert ai_budget_soft_exceeded |
| 5 | Structured log ai.invoke; provider health in DB |
| 6 | ADR-067; construction-brain re-exports; docs/ai/AI_PLATFORM.md |

## Files touched (main)

- **Providers:** provider.errors.ts, provider.anthropic.ts, provider.gemini.ts, provider.router.ts, index.ts; provider.*.test.ts, provider.errors.test.ts, provider.router.test.ts.
- **Routing:** routing/models.ts, routing/tenant-ai-preferences.ts.
- **Governance:** policy.types.ts, policy.service.ts, policy.service.test.ts.
- **Usage/cost:** ai-usage.service.ts, cost-estimator.ts, ai-usage.service.test.ts; alert.service.ts (AlertType).
- **AI service:** ai.service.ts, ai.service.test.ts.
- **Route:** app/api/ai/analyze-image/route.ts, route.test.ts.
- **Construction brain:** lib/ai/construction-brain/index.ts.
- **Docs:** REPORT-PHASE3-AI-PLATFORM.md, ADR/067-ai-platform-routing-governance.md, docs/ai/AI_PLATFORM.md.

## Env vars (reference)

- Existing: `OPENAI_API_KEY`, `OPENAI_VISION_MODEL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.
- To add (Stage 1): `ANTHROPIC_API_KEY`, `ANTHROPIC_VISION_MODEL`; `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY`, `GEMINI_VISION_MODEL`.

---

## Observability sample (no secrets)

```json
{"event":"ai.invoke","tenantId":"...","userId":"...","traceId":"...","providerSelected":"openai","modelSelected":"gpt-4o","latencyMs":1200,"costEstUsd":0.005,"tokensIn":500,"tokensOut":300,"policyDecisionId":"...","outcome":"success","ts":"2026-03-05T..."}
```

## Follow-ups (post–Phase 3)

- Phase 4: mobile push / offline.
- Phase 5: dashboard (e.g. provider health, budget usage).
- Optional: in-process metrics (counters/histograms) when a metrics backend is adopted; log-based metrics can be used until then.
