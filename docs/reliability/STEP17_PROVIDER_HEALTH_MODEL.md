# Step 17 — AI Provider Health / Dependency Status Model

## 1. Goal

Expose the strongest practical view of AI provider health so operators can tell whether failures are isolated to one provider or broader runtime. No full status platform; reuse existing audit and diagnostics.

---

## 2. What exists today

- **audit_logs** (resource_type=ai_runtime): details include **provider** (openai, anthropic, gemini) and **error_kind** (provider_unavailable, provider_timeout, rate_limit, etc.).
- **GET /api/v1/admin/ops/diagnostics:** ai_runtime.errors_by_kind, by_route, recent_error_sample. Each sample is from an audit row; details may include provider.
- **GET /api/v1/admin/ops/ai-runtime:** Same audit data; drilldown by_route, complete_count, error_count, error_rate_window; operator_hints.
- **Circuit breaker:** ai_provider_health table (if used in code path) records provider state; not exposed in a dedicated API in repo. Code may use it for fallback routing.

---

## 3. Provider health view (practical)

**From existing data:**
- **errors_by_kind** already groups by error_kind (provider_timeout, provider_unavailable, rate_limit). These are provider-related. If these dominate, "AI provider degradation" is likely.
- **recent_error_sample** rows have details; if details.provider is present, aggregate **by provider** from recent_error_sample (and optionally from full aiRows) to get "which provider is failing."
- **Fallback visibility:** If circuit breaker is in use, "fallback_triggered" or similar in audit indicates fallback was used. Operator can infer: one provider open → others may be serving.

**Strongest implementation:** In diagnostics (or ai-runtime) response, add **provider** dimension:
- From aiRows, group error rows by details.provider; emit **errors_by_provider** (e.g. { "gemini": 5, "openai": 1 }). Then operator sees "Gemini is failing more than OpenAI."
- If no provider in details, use "unknown"; still useful to see total errors by route.

---

## 4. Route / provider correlation

- **by_route** already in diagnostics. Routes map to output_type (copilot, intelligence, vision). Vision uses one of the providers; copilot/intelligence may use another. So by_route + errors_by_provider together answer "vision is failing and it's Gemini."
- Document in operator_hints: "If errors_by_kind has provider_timeout/provider_unavailable, check errors_by_provider to see which provider; check provider status pages."

---

## 5. Isolated vs broader

- **Isolated to one provider:** errors_by_provider has one provider with most errors; others zero or low. Action: monitor; fallback may be in use; or disable that provider if configurable.
- **Broader runtime:** errors across providers or error_kind is auth_failure, persistence_failure. Action: app/config issue; see runbook.

---

## 6. What we do not build

- No external status page aggregation (e.g. fetching OpenAI status API).
- No real-time "provider up/down" dashboard. We infer from our own audit data only.
- No automatic provider disable in repo; document as manual or feature-flag if available.
