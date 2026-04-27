# AI System Status

**Scope:** Vision (`analyzeImage`), provider router, governance, usage, jobs, Copilot (non-stream + stream).

_Last aligned with repo: 2026-04._

---

## 1. Components Inventory

| Component | Location | Role |
|-----------|----------|------|
| **AIService** | `apps/web/lib/platform/ai/ai.service.ts` | `analyzeImage`: policy → `invokeVisionWithRouter` → normalize → `recordUsage`. |
| analyze-image routes | `apps/web/app/api/v1/ai/analyze-image/route.ts`, `apps/web/app/api/ai/analyze-image/route.ts` | Rate limit, quota, then `analyzeImage(admin, …)`. |
| `runVisionAnalysis` | `apps/web/lib/ai/runVisionAnalysis.ts` | Thin wrapper → `analyzeImage` (jobs + legacy). |
| Provider router | `apps/web/lib/platform/ai/providers/provider.router.ts` | Tenant prefs, circuit breaker, fallback across providers. |
| OpenAI / Anthropic / Gemini | `provider.openai.ts`, `provider.anthropic.ts`, `provider.gemini.ts` | Vision implementations (keys optional per provider). |
| AI usage | `apps/web/lib/platform/ai-usage/ai-usage.service.ts` | `checkQuota`, `recordUsage`, budget alerts. |
| Policy | `apps/web/lib/platform/ai-governance/policy.service.ts` | `runPolicy` + PII image host rules when applicable. |
| Jobs | `apps/web/lib/platform/jobs/job.handlers/ai-analyze-media.ts` | Uses `analyzeImage`. |
| Copilot brief (GET) | `apps/web/app/api/v1/projects/[id]/copilot/route.ts` | `gateCopilotLlmRequest` → OpenAI JSON brief → `recordUsage` (via provider callback). |
| Copilot stream (POST) | `apps/web/app/api/v1/projects/[id]/copilot/chat/stream/route.ts` | Requires admin client; same gate; OpenAI SSE with `stream_options.include_usage`; `recordCopilotStreamUsage`. |
| Copilot gate | `apps/web/lib/copilot/copilot-ai-gate.ts` | Rate limit, quota reserve, policy; `estimatedCostUsd` for brief vs stream. |

---

## 2. Data Flow (Current)

**Vision (sync routes + jobs):**  
Request → rate-limit, quota (routes) → **`analyzeImage`** → `runPolicy` (when `tenantId`) → **`invokeVisionWithRouter`** → parse/normalize → **`recordUsage`** (when `tenantId`).

**Copilot GET:**  
`gateCopilotLlmRequest` (rate limit, quota, policy) → `runCopilot` + OpenAI provider → usage callback → JSON response.

**Copilot POST stream:**  
Same gate (higher `COPILOT_STREAM_ESTIMATE_USD`) → thread + messages → OpenAI streaming with usage chunk → **`recordCopilotStreamUsage`** (best-effort).

---

## 3. Modularity

| Aspect | Status |
|--------|--------|
| Single vision entry | **Yes.** `analyzeImage` only; routes/jobs do not call providers directly. |
| Provider abstraction + router | **Yes.** Used by `analyzeImage`. |
| Policy on vision | **Yes.** When tenant context is present. |
| Text/chat multi-provider router | **No.** Copilot uses OpenAI chat completions with shared retry/timeout (`lib/platform/ai/openai-http-retry.ts`, `openai-chat-completion.ts`). |

---

## 4. Cost Control

| Mechanism | Status |
|-----------|--------|
| Quota check (tenant) | **Yes.** Vision routes, Copilot GET/stream (reserved estimate before call). |
| Usage recording | **Yes.** Vision after success; Copilot non-stream in provider callback; stream after completion (tokens from stream or heuristic). |
| Rate limit | **Yes.** Vision routes; Copilot gate. |

---

## 5. Error Handling

| Aspect | Status |
|--------|--------|
| Vision retries / timeout | Route-level + provider timeouts; router fallback across providers. |
| Circuit breaker | **Used** via `invokeVisionWithRouter`. |
| Copilot stream | Timeout abort; deterministic fallback on provider errors; **503** if service role missing (`ai_admin_unavailable`). |

---

## 6. Rate Limits and Quotas

- **Rate limit:** `checkRateLimit` on vision routes and inside `gateCopilotLlmRequest`.
- **Quota:** `checkQuota` before LLM; 402 with `ai_budget_exceeded` where enforced.
- **Tables:** `rate_limit_slots`, `ai_usage`, `tenant_billing_state` (see migrations).

---

## 7. Remaining Gaps

1. **Copilot text routing:** Unify OpenAI chat calls behind a small text router (optional Anthropic/Gemini) mirroring vision router patterns.
2. **Stream without service role:** Streaming returns **503** if `getAdminClient()` is null so usage cannot be persisted; local/dev must set `SUPABASE_SERVICE_ROLE_KEY` for streaming.
3. **Docs / product naming:** “Construction brain” vs `lib/ai` paths — keep product language in docs only if needed.
