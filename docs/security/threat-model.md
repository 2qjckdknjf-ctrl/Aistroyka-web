# Aistroyka AI Platform — Formal Threat Model (STRIDE + AI)

**Version:** 1.0  
**Classification:** Internal / Enterprise audit  
**Scope:** AI Copilot, RAG, resilience, multi-tenant data isolation.

---

## 1.1 System overview

- **Multi-tenant AI SaaS:** Tenants own projects; users are members of tenants. All data access is scoped by tenant/project and enforced at the database layer (RLS).
- **RLS isolation:** PostgreSQL Row Level Security on core tables; SELECT/INSERT/UPDATE/DELETE policies bound to `tenant_members` / `project_members` and `auth.uid()`.
- **Edge functions:** Supabase Edge (Deno) — aistroyka-llm-copilot (orchestrator), aistroyka-ai-memory (RAG, snapshots, governance), resilience-cron (cleanup, watchdog, SLO rollup). Service role for DB; JWT or anon for client-originated calls.
- **RAG v2:** Embeddings stored per project; search_context retrieves chunks by similarity; low_confidence guard when retrieval is empty or below threshold.
- **Circuit breaker:** Distributed state in DB (ai_circuit_breakers); opens on high LLM error rate; watchdog heals stuck open/half_open.
- **Rate limiting:** Per-tenant requests_per_minute (tenant_request_counters); atomic check-and-increment before LLM.
- **Token budgets:** Per-tenant monthly_token_limit (tenant_token_usage); global LLM_MONTHLY_TOKEN_BUDGET / per-user limits (env). Enforcement before LLM; deterministic fallback when exceeded.
- **Concurrency:** Lease-based (tenant_request_leases) with TTL; no sticky in_flight on crash.

---

## 1.2 Trust boundaries

| Boundary | From → To | Trust assumption |
|----------|-----------|-------------------|
| **Client (web / iOS)** | User device → Edge | Client can be compromised or malicious; all input is untrusted. |
| **Edge** | Edge → Supabase DB | Edge has service role; DB trusts Edge for writes to resilience/audit tables. |
| **Edge** | Edge → LLM provider (OpenAI) | Provider is third-party; responses and latency are not fully under our control. |
| **External webhook (alerts)** | Edge → Customer/SIEM | Outbound only; URL configured per env; no trust of callback. |
| **Cron / system** | Scheduler → resilience-cron | x-cron-secret; only known caller. |

---

## 1.3 STRIDE analysis (by component)

### Client → Edge (Copilot / Memory)

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Spoofing** | Impersonation of another user/tenant | JWT from Supabase Auth; tenant_id in body validated only in combination with RLS (DB). Edge does not trust body.tenant_id for authorization; RLS enforces membership. |
| **Tampering** | Altered request (mode, context, prompts) | TLS; body parsed once; prompt injection detection on user_question and historical_context. |
| **Repudiation** | Denial of having sent a request | request_id in ai_llm_logs and ai_security_events; X-Request-Id on response. |
| **Information disclosure** | Leak of other tenants’ data | RLS on all tenant/project tables; Edge uses service role but queries are per-request; no cross-tenant reads in app logic. |
| **Denial of service** | Exhaustion of capacity | Rate limit (per-tenant RPM), lease-based concurrency (TTL), token budget, circuit breaker. |
| **Elevation of privilege** | Access to admin or other tenant | No admin API in scope; RLS + JWT; tenant_id from body used for limits only; data access always via RLS. |

### Edge → Supabase DB

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Spoofing** | Non-Edge caller writing to DB | Service role key secret; anon/authenticated cannot write to resilience tables (no INSERT policy or policy = false). |
| **Tampering** | Corruption of counters / breaker state | Atomic RPCs (security definer); advisory locks for breaker. |
| **Repudiation** | Who changed what | ai_llm_logs, ai_security_events, timestamps; no separate audit table for DB admin. |
| **Information disclosure** | DB dump / query leak | RLS; service role bypasses RLS but Edge code does not issue cross-tenant SELECT. |
| **Denial of service** | DB overload | Rate and concurrency limits reduce load; circuit breaker stops LLM calls; retention cleanup prevents table bloat. |
| **Elevation of privilege** | RPC or policy bypass | RPCs are security definer with fixed search_path; no dynamic SQL from client. |

### Edge → LLM provider

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Spoofing** | Fake provider response | TLS; API key in env. |
| **Tampering** | Response manipulation | Out of our control; validation of output (schema, no new numbers); exfiltration filter. |
| **Repudiation** | Provider denies outage | We log latency and fallback_reason; no provider audit. |
| **Information disclosure** | Prompt/context sent to provider | User and context sent to OpenAI; contractual and privacy concern; no PII in prompts by policy. |
| **Denial of service** | Provider down / rate limit | Circuit breaker; fallback model; deterministic fallback; timeouts. |
| **Elevation of privilege** | N/A | N/A. |

### External webhook (alerts)

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Spoofing / Tampering** | N/A (we send out) | Outbound only. |
| **Repudiation** | Claim alert not sent | We log event_type; dedup table; no delivery guarantee. |
| **Information disclosure** | URL or payload leak | ENV; payload contains event_type, tenant_id, request_id, details (no PII by design). |
| **Denial of service** | Webhook slow/fail | Fire-and-forget; non-blocking. |

---

## 1.4 AI-specific threats

| Threat | Description | Mitigation |
|--------|-------------|------------|
| **Prompt injection** | User input crafted to override system instructions or extract data | detectPromptInjection(); block and log; safe response; ai_security_events. |
| **Data exfiltration** | LLM or response used to leak internal data | redactExfiltrationFromPayload(); block long base64/sensitive patterns; ai_security_events data_exfiltration_attempt. |
| **Retrieval poisoning** | Malicious content in RAG store to influence answers | Embeddings and chunks are per project; access via RLS; no public write to RAG from untrusted client in scope. Quality/poisoning is operational risk. |
| **Model hallucination** | LLM invents numbers or facts | Strict schema; validation that numbers come from context only; fallback on violation. |
| **Tool misuse** | Unauthorized use of search_context or other tools | assertAllowedTool("search_context"); JWT required for RAG path. |
| **Token exhaustion attack** | Consume budget to deny service | Per-tenant monthly_token_limit; global budget; deterministic fallback when exceeded; no LLM call. |
| **Concurrency exhaustion attack** | Hold all slots to block others | Lease-based concurrency with TTL; no sticky slots; rate limit per minute. |

---

## 1.5 Mitigations mapping

| Mitigation | Applies to |
|------------|------------|
| **RLS** | All tenant/project tables; isolation and information disclosure. |
| **Prompt guard** | Injection; tool allowlist. |
| **Injection detection** | Prompt injection; block and log. |
| **Lease-based concurrency** | DoS and concurrency exhaustion; TTL self-healing. |
| **Distributed circuit breaker** | LLM degradation and DoS; shared state across Edge instances. |
| **Token budget enforcement** | Token exhaustion; per-tenant and global. |
| **Alert dedup** | Operational; avoid alert spam; does not mitigate attacks. |
| **Exfiltration filter** | Data exfiltration attempt. |
| **PII detection** | Logging and blocking in sensitive paths. |
| **Rate limiting** | DoS and fairness. |

---

## 1.6 Residual risks (no embellishment)

- **LLM provider:** We do not control availability, latency, or content of third-party API; residual risk of prolonged outage or inappropriate output despite validation.
- **Tenant_id in body:** Rate/token/lease checks use body.tenant_id; if client sends a different tenant_id they can consume that tenant’s quota. RLS still prevents reading other tenants’ data. Acceptable for MVP; future: derive tenant from JWT or project.
- **Prompt injection:** Heuristic-based; sophisticated attacks may evade; we block and log but cannot guarantee no bypass.
- **Retrieval quality:** No formal integrity or poisoning checks on stored embeddings; trust in ingestion path and RLS.
- **Audit trail:** ai_llm_logs and ai_security_events support audit; no immutable append-only guarantee or hash chain.
- **Backup and key management:** Documented in backup-restore.md; key rotation and backup encryption depend on Supabase and env practices.
