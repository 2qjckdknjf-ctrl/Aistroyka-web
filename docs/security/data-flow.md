# Aistroyka AI Platform — Data Flow (Request Lifecycle)

**Purpose:** Textual architecture for enterprise audit; request lifecycle, trust boundaries, and attack surface.

---

## Request lifecycle (step by step)

1. **Client** sends POST to Edge `aistroyka-llm-copilot` with body: `mode`, `decision_context`, optional `user_question`, `project_id`, `tenant_id`, `request_id`. Headers: `Authorization` (JWT or anon), optional `X-Request-Id`.
2. **Request id:** If `body.request_id` present and non-empty, it is used; else server generates UUID. Same value is returned in header `X-Request-Id` and written to all logs.
3. **Parse and validate:** Body size limit (50 KB); mode in allowlist; decision_context required. On failure → 400.
4. **Tenant and limits (if tenant_id present):** Rate limit (check_and_increment_tenant_request) → 429 if over; token budget (get_tenant_token_budget_ok) → fallback if over; concurrency (acquire_tenant_lease) → 429 if no slot. On exit: release_tenant_lease.
5. **Prompt injection check:** detectPromptInjection(); if flagged → ai_security_events prompt_injection, ai_llm_logs, safe response 200.
6. **PII check:** Optional logging; block in sensitive path if needed.
7. **Circuit breaker:** circuit_breaker_allow("copilot"). If not allowed → fallback, ai_security_events circuit_open, return 200.
8. **Retrieval (RAG):** If mode/context require RAG and project_id and Authorization: get embedding, POST aistroyka-ai-memory search_context. request_id and project_id passed. retrieval_ms and low_confidence recorded.
9. **LLM call:** OpenAI with timeout. On success: add_tenant_token_usage(tenant_id, month, tokens_used). circuit_breaker_record("copilot", success).
10. **Validation and exfiltration:** Schema and no-new-numbers validation; redactExfiltrationFromPayload; if blocked → ai_security_events data_exfiltration_attempt.
11. **Latency:** total_ms; if > 5000 → ai_security_events latency_budget_exceeded.
12. **Log:** ai_llm_logs (request_id, tenant_id, mode, tokens_used, retrieval_ms, llm_ms, total_ms, fallback_reason, etc.).
13. **Response:** 200 JSON; header X-Request-Id.

---

## Where request_id travels

Set at entry (body or generated). Passed to aistroyka-ai-memory search_context. Stored in ai_llm_logs, ai_security_events. Returned in X-Request-Id.

---

## Where tenant_id is validated

Not used for data authorization; RLS uses JWT. Used for rate limit, token budget, concurrency. Risk: client can send arbitrary tenant_id and consume that tenant quotas; data access still protected by RLS.

---

## Where RLS applies

All tenant/project tables: policies via tenant_members/project_members and auth.uid(). Resilience tables: SELECT false for app roles; only service role (Edge) writes.

---

## Where tokens are counted

After LLM completion: usage.total_tokens → ai_llm_logs.tokens_used; add_tenant_token_usage(tenant_id, month, tokens_used). Global/per-user limits checked from ai_llm_logs aggregates.

---

## Where breaker is checked

Before LLM: circuit_breaker_allow("copilot"). After LLM: circuit_breaker_record("copilot", success). Cron: heal_circuit_breakers().

---

## Where retrieval happens

Inside Edge when RAG required; POST aistroyka-ai-memory with action search_context. RLS on embeddings/chunks by project_members.

---

## Where logs are written

ai_llm_logs: every Copilot request. ai_security_events: rate_limit_exceeded, prompt_injection, pii_detected, circuit_open, data_exfiltration_attempt, latency_budget_exceeded. ai_retrieval_logs: in ai-memory per retrieval.

---

## Attack surface summary

| Surface | Controls |
|---------|----------|
| Copilot POST | Auth, body size, injection/PII checks, rate/token/concurrency limits. |
| Memory search_context | RLS; called by Edge with project/request context. |
| resilience-cron | x-cron-secret only. |
| Supabase DB | RLS; service role for Edge. |
| LLM provider | Timeout, circuit breaker, no PII in prompts. |
| Alert webhook | Outbound; dedup. |
