# Phase 3 — AI Platform Report

**Project:** AISTROYKA  
**Phase:** AI Platform (multi-provider, routing, governance, observability, construction brain alignment).  
**Scope:** Platform-level AI hardening and documentation. No UI features. No product expansion.

**Status:** In progress.

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
|-----------|------|--------|
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

## Stage 1 — Provider interfaces + real providers

*To be filled after implementation.*

---

## Stage 2 — Router: model + provider routing, fallback, tenant overrides

*To be filled after implementation.*

---

## Stage 3 — Policy Engine: decisions + audit trail

*To be filled after implementation.*

---

## Stage 4 — Cost governance: budgets + alerts

*To be filled after implementation.*

---

## Stage 5 — Observability

*To be filled after implementation.*

---

## Stage 6 — Construction brain alignment

*To be filled after implementation.*

---

## Stage 7 — Final verification & report

*To be filled after verification.*

---

## Env vars (reference)

- Existing: `OPENAI_API_KEY`, `OPENAI_VISION_MODEL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.
- To add (Stage 1): `ANTHROPIC_API_KEY`, `ANTHROPIC_VISION_MODEL`; `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY`, `GEMINI_VISION_MODEL`.

---

## Follow-ups (post–Phase 3)

- Phase 4: mobile push / offline.
- Phase 5: dashboard (e.g. provider health, budget usage).
