# AI platform

Platform-level AI: entrypoints, policy, routing, providers, budgets, observability.

## Entrypoints

- **AIService** (`apps/web/lib/platform/ai/ai.service.ts`): Single façade for vision. `analyzeImage(admin, ctx, { imageUrl, ... })` → Policy → Router → normalize → usage. Used by:
  - `POST /api/ai/analyze-image` and `POST /api/v1/ai/analyze-image`
  - Job handler `ai_analyze_media`
- **Construction brain** (`apps/web/lib/ai/construction-brain/index.ts`): Re-exports prompts, normalize, types, riskCalibration for vision/analysis.

## Flow

1. **Policy** (`lib/platform/ai-governance/policy.service.ts`): `runPolicy` evaluates tier/limits and optional PII (strict + image host). Decision written to `ai_policy_decisions`; returns `decisionId`. Block → 403 with code `ai_policy_denied`.
2. **Router** (`lib/platform/ai/providers/provider.router.ts`): Loads tenant preferences from `tenant_feature_flags` (ai_provider_preference, ai_model_tier, ai_fallback_enabled). Orders providers, resolves model from tier, invokes with circuit breaker; fallback on retryable errors only.
3. **Providers:** OpenAI (existing), Anthropic, Gemini. Each optional via env; missing key → provider skipped. Normalized `VisionResult`: content, usage, providerUsed, modelUsed.
4. **Usage & cost:** `recordUsage` to `ai_usage`; `checkQuota` / `checkBudgetAlert` use tier limits and emit alerts at soft/hard budget.

## Enabling providers

- **OpenAI:** `OPENAI_API_KEY`, `OPENAI_VISION_MODEL` (default gpt-4o).
- **Anthropic:** `ANTHROPIC_API_KEY`, `ANTHROPIC_VISION_MODEL` (default claude-sonnet-4-20250514).
- **Gemini:** `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY`, `GEMINI_VISION_MODEL` (default gemini-1.5-flash).

At least one provider must be configured; 503 when none.

## Tenant preferences (feature flags)

- `ai_provider_preference`: variant `openai` | `anthropic` | `gemini` — preferred provider first.
- `ai_model_tier`: variant `low` | `standard` | `high` — maps to provider-specific models.
- `ai_fallback_enabled`: enabled = try other providers on failure; disabled = preferred only.

## Budgets and alerts

- Monthly budget from tier limits; exceed → 402, code `ai_budget_exceeded`, alert created.
- At 80% of monthly budget → alert `ai_budget_soft_exceeded` (warn); request still allowed.

## Observability

- **Logs:** Each successful AI call logs `event=ai.invoke` with tenantId, traceId, providerSelected, modelSelected, latencyMs, costEstUsd, tokensIn/Out, policyDecisionId. No PII.
- **Provider health:** `ai_provider_health` (circuit state per provider); admin can query.

## Troubleshooting

- **503 "No AI vision provider is configured"** — set at least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY/GEMINI_API_KEY.
- **403 ai_policy_denied** — policy blocked (tier limit, image count/size, or PII strict + untrusted image host). Check `ai_policy_decisions` and rule_hits.
- **402 ai_budget_exceeded** — monthly budget exceeded; check tier limits and `tenant_billing_state` / `ai_usage`.
- **502/504** — all providers failed or timeout; check `ai_provider_health` and provider keys.
