# Phase 3 — AI Platform Report

**Scope:** Multi-provider, routing, governance, observability, construction brain alignment. No UI features. No product expansion. Platform-level AI hardening and documentation only.

**Non-negotiables:** v1 API contracts preserved; Phase 1–2 outcomes intact; AIService single façade; all provider calls via Provider Router + circuit breaker; Policy Engine for all AI requests; production routing; cost governance; observability; tests + build + cf:build per stage; final ADR and this report.

---

## Stage 0 — Audit (Completed)

### 0.1 Locations

| Component | Path | Notes |
|-----------|------|------|
| AIService | `apps/web/lib/platform/ai/ai.service.ts` | Single entry: `analyzeImage()`; calls policy → router → usage. |
| Provider Router | `apps/web/lib/platform/ai/providers/provider.router.ts` | `invokeVisionWithRouter()`; uses circuit breaker; fixed order openai → anthropic → gemini. |
| OpenAI provider | `apps/web/lib/platform/ai/providers/provider.openai.ts` | Real: OPENAI_API_KEY, OPENAI_VISION_MODEL, 85s timeout, VisionResult. |
| Anthropic provider | `apps/web/lib/platform/ai/providers/provider.anthropic.stub.ts` | Stub: returns null. |
| Gemini provider | `apps/web/lib/platform/ai/providers/provider.gemini.stub.ts` | Stub: returns null. |
| Circuit breaker | `apps/web/lib/platform/ai/providers/circuit-breaker.ts` | `getCircuitState`, `recordSuccess`, `recordFailure`, `canInvoke`; table `ai_provider_health`. |
| Policy Engine | `apps/web/lib/platform/ai-governance/policy.service.ts` | `runPolicy`, `checkPolicy`, `recordPolicyDecision`; table `ai_policy_decisions`. |
| Policy rules | `apps/web/lib/platform/ai-governance/policy.rules.ts` | Tier + image count/size; returns allow/block/degrade. |
| Usage service | `apps/web/lib/platform/ai-usage/ai-usage.service.ts` | `checkQuota`, `recordUsage`, `estimateVisionCostUsd`; uses `ai_usage` + `tenant_billing_state`. |
| Cost estimator | `apps/web/lib/platform/ai-usage/cost-estimator.ts` | `estimateCostUsd(model, in, out)`; gpt-4o / gpt-4o-mini only. |
| Migrations | `apps/web/supabase/migrations/20260308300000_ai_provider_health.sql`, `20260307400000_ai_policy_decisions.sql` | Tables exist. |

### 0.2 Gaps (Phase 1–2 vs Phase 3 goals)

- **Policy:** Already called first in AIService; decisions persisted to `ai_policy_decisions`. Missing: standardized decision object (decisionId, reasons[], piiRisk?, redactions?, policyVersion); minimal PII hook (strict mode / trusted URL) not present.
- **Router:** No tenant preferences (tenant_settings / tenant_data_plane / tenant_feature_flags). No model tier → model name mapping; no retryable vs non-retryable distinction; no sticky selection per request.
- **Providers:** Anthropic and Gemini are stubs (return null). No ProviderUnavailable or typed failure; no shared error shapes for router.
- **Usage/quotas:** checkQuota uses `getLimitsForTenant` → `monthly_ai_budget_usd` and `tenant_billing_state.spent_usd`. No daily budget; no soft/hard split; no alert hooks.
- **Observability:** Route logs `ai_analyze_image` with status/duration/trace_id/tenant_id; no providerSelected, modelSelected, fallbackCount, costEstUsd, policyDecisionId. No metrics module counters; circuit breaker state in DB but no dedicated admin “provider health” endpoint documented.
- **Construction brain:** Vision logic in `lib/ai/` (prompts, normalize, types); no single re-export surface.

### 0.3 API contract (preserve)

- **Route:** `POST /api/ai/analyze-image` and `POST /api/v1/ai/analyze-image` (re-export). Request: `{ image_url, media_id?, project_id? }`. Response 200: `AnalysisResult` (stage, completion_percent, risk_level, detected_issues, recommendations). Errors: 400, 413, 402 quota, 429 rate limit, 403 policy, 502/504 AI, 503 no key.

---

## Stage 1 — Provider Interfaces + Real Providers (Anthropic + Gemini) ✅

- **Provider errors:** `provider.errors.ts` — `ProviderUnavailableError`, `ProviderError`, `isRetryableError()` (for router Stage 2).
- **Config:** `ANTHROPIC_API_KEY`, `ANTHROPIC_VISION_MODEL`, `GOOGLE_AI_API_KEY` (or `GEMINI_API_KEY`), `GEMINI_VISION_MODEL`; `isAnyVisionProviderConfigured()`.
- **Anthropic:** `provider.anthropic.ts` — Messages API, image via URL, timeout 85s, normalized `VisionResult`. Missing key → returns null.
- **Gemini:** `provider.gemini.ts` — fetches image URL → base64, generateContent with `responseMimeType: application/json`. Missing key → null. `toBase64()` works in Node and Edge.
- **Cost estimator:** Added Claude and Gemini model prices.
- **Route:** 503 when no vision provider configured (any of OpenAI/Anthropic/Gemini).
- **Tests:** `provider.anthropic.test.ts`, `provider.gemini.test.ts` — missing key → null, success response parsing, request shape. Stubs removed.
- **Build/test:** Unit tests 220 passed; Next.js build passed.

---

## Stage 2 — Router: Model + Provider Routing, Fallback, Tenant Overrides

*Placeholder: tenant preference source (tenant_feature_flags or tenant_data_plane), providerCandidates order, circuit breaker + retryable vs non-retryable, model tier mapping, tests.*

---

## Stage 3 — Policy Engine: Consistent Decisions + Audit Trail

*Placeholder: decision object shape, ai_policy_decisions enrichment, minimal PII hook, AIService 403 + code "ai_policy_denied", tests.*

---

## Stage 4 — Cost Governance: Budgets + Alert Hooks

*Placeholder: tenant budgets (soft/hard daily/monthly), checkBudget in ai-usage.service, alert type ai_budget_exceeded, tests.*

---

## Stage 5 — Observability: Metrics, Logs, Trace Correlation

*Placeholder: structured ai.invoke log, metrics (counters/histograms), provider health reporting, tests.*

---

## Stage 6 — Construction Brain Alignment

*Placeholder: ADR routing/governance, lib/ai/construction-brain re-exports, docs/ai/AI_PLATFORM.md.*

---

## Stage 7 — Final Verification & Report

*Placeholder: npm test, build, cf:build; env vars; routing summary; budget keys; observability fields; follow-ups Phase 4/5.*

---

*Document generated in Stage 0. Updated after each stage.*
