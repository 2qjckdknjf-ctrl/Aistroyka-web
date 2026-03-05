# AI System Status

**Scope:** AIService, provider integration, image analysis, OpenAI config, governance, job pipeline.

---

## 1. Components Inventory

| Component | Location | Role |
|-----------|----------|------|
| analyze-image route | app/api/ai/analyze-image/route.ts | Entry for sync image analysis; calls OpenAI directly. |
| runVisionAnalysis | lib/ai/runVisionAnalysis.ts | Shared vision logic; calls OpenAI directly; used by job handlers. |
| Provider Router | lib/platform/ai/providers/provider.router.ts | invokeVisionWithRouter; circuit breaker + fallback. |
| OpenAI provider | lib/platform/ai/providers/provider.openai.ts | Implements vision interface. |
| Anthropic / Gemini | provider.anthropic.stub.ts, provider.gemini.stub.ts | Stubs. |
| Circuit breaker | lib/platform/ai/providers/circuit-breaker.ts | canInvoke, recordSuccess, recordFailure; table ai_provider_health. |
| AI usage | lib/platform/ai-usage/ai-usage.service.ts | checkQuota, recordUsage, estimateVisionCostUsd; table ai_usage. |
| Policy engine | lib/platform/ai-governance/policy.service.ts | Policy checks (e.g. PII, allow/deny). |
| Job handlers | lib/platform/jobs/job.handlers/ai-analyze-media.ts, ai-analyze-report.ts | Enqueue/run async AI; use runVisionAnalysis. |

---

## 2. Data Flow (Current)

**Sync (analyze-image):**  
Request → rate-limit, quota → `fetch(openai.com)` in route → normalize, calibrate → recordUsage → response.  
**Policy Engine and Provider Router are not in the path.**

**Async (job):**  
Job claimed → handler loads payload → runVisionAnalysis(imageUrl) → OpenAI direct → result stored; usage can be recorded.  
**Provider Router and circuit breaker not used.**

---

## 3. Modularity

| Aspect | Status |
|--------|--------|
| Single entry (AIService) | **No.** Route and runVisionAnalysis both call OpenAI. |
| Provider abstraction | **Yes.** provider.interface, provider.openai, stubs; router exists. |
| Router usage | **No.** Route and runVisionAnalysis do not call invokeVisionWithRouter. |
| Policy engine usage | **No.** Not invoked by analyze-image or runVisionAnalysis. |

---

## 4. Cost Control

| Mechanism | Status |
|-----------|--------|
| Quota check (tenant) | **Yes.** checkQuota before calling OpenAI in route. |
| Usage recording | **Yes.** recordUsage in route and in runVisionAnalysis (when recordUsageWithAdmin passed). |
| Cost estimation | **Yes.** estimateCostUsd, estimateVisionCostUsd in ai-usage. |
| Rate limit (tenant/IP) | **Yes.** checkRateLimit in route. |

---

## 5. Error Handling

| Aspect | Status |
|--------|--------|
| Retry on 5xx | **Yes.** OPENAI_RETRY_ON_5XX in route. |
| Timeout | **Yes.** OPENAI_VISION_TIMEOUT_MS, AbortController. |
| Circuit breaker | **Implemented but unused** in main AI path (router uses it). |
| Fallback provider | **Implemented in router** but router not used by route/handlers. |

---

## 6. Rate Limits and Quotas

- **Rate limit:** Applied in route via checkRateLimit (tenant + IP + endpoint).
- **Quota:** checkQuota (tenant) before call; 402 and code "quota_exceeded" returned.
- **Tables:** rate_limit_slots, ai_usage, tenant_billing_state (from migrations).

---

## 7. Gaps and Recommendations

1. **Governance bypass:** All AI calls should go through AIService → Policy Engine → Provider Router. **Action:** Add AIService (or VisionService) that uses policy.service and provider.router; route and job handlers call only this service.
2. **Circuit breaker unused:** Router + circuit breaker exist but are not in the call path. **Action:** Use router in the new AIService so circuit breaker and multi-provider fallback apply.
3. **Stubs:** Anthropic and Gemini are stubs; production multi-provider requires real implementations and config.
4. **Construction brain / vision modules:** Guardrails mention apps/web/lib/ai/construction-brain/ and lib/ai/vision/; current code is lib/ai (vision, prompts, normalize) and lib/intelligence (dashboard). Align naming or docs if “construction brain” is a product term.
