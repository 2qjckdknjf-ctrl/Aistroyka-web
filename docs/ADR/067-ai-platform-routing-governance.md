# ADR-067: AI platform routing and governance (Phase 3)

**Status:** Accepted  
**Date:** 2026-03

## Decision

- **Router:** Single façade AIService → Policy Engine → Provider Router → providers. All sync routes and async jobs use AIService; no direct provider calls.
- **Provider selection:** Order from tenant preferences (`tenant_feature_flags`: `ai_provider_preference`, `ai_fallback_enabled`). Preferred provider first; fallback to others when enabled and on retryable errors only (not on invalid_input/auth).
- **Model tiers:** Central mapping in `lib/platform/ai/routing/models.ts`: low/standard/high → provider-specific model names (e.g. standard → gpt-4o, claude-sonnet-4-20250514, gemini-1.5-flash). Default tier: standard.
- **Budget enforcement:** Monthly budget from tier limits (`monthly_ai_budget_usd`). Hard exceed → 402 with code `ai_budget_exceeded` and alert `ai_budget_exceeded`. Soft threshold (80%) → alert `ai_budget_soft_exceeded` only; request allowed.
- **Observability:** Structured log per AI call: `event=ai.invoke`, tenantId, traceId, providerSelected, modelSelected, latencyMs, costEstUsd, policyDecisionId. Provider health in `ai_provider_health` (circuit breaker). No PII or image URLs in logs.
- **Policy:** Every request produces a policy decision record in `ai_policy_decisions`; decisionId returned and logged. Optional PII hook: strict mode + untrusted image host → block (configurable via `AI_TRUSTED_IMAGE_HOSTS`).

## Context

Phase 3 AI platform hardening: multi-provider (OpenAI, Anthropic, Gemini), tenant-aware routing, cost governance, and production observability without UI or product expansion.

## Consequences

- Contract stability: `/api/v1/ai/analyze-image` request/response and status codes unchanged; 402 code is `ai_budget_exceeded` (replacing `quota_exceeded` for budget path).
- Env: `ANTHROPIC_API_KEY`, `ANTHROPIC_VISION_MODEL`; `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY`, `GEMINI_VISION_MODEL`; optional `AI_TRUSTED_IMAGE_HOSTS` for PII strict mode.
- Construction brain: vision prompts and normalization remain in `lib/ai`; optional re-export surface at `lib/ai/construction-brain` for clarity.
