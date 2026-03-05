# Aistroyka AI Platform — Executive Security Summary

**Audience:** Enterprise customers, security and compliance reviewers.  
**Classification:** Customer-facing.

---

## Architecture overview

Aistroyka is an AI-first construction intelligence platform. The AI layer consists of:

- **Multi-tenant SaaS** with tenant and project hierarchy; users are members of tenants and access projects via membership.
- **Edge services** (Supabase Edge): AI Copilot (LLM orchestration), AI Memory (RAG, embeddings, search), and a resilience cron (cleanup, circuit breaker watchdog, retention, SLO rollups).
- **Data layer:** PostgreSQL (Supabase) with Row Level Security (RLS) on all tenant and project data.
- **AI provider:** Third-party LLM (e.g. OpenAI) for completion; responses validated and filtered before returning to clients.

---

## Key protections

- **Zero-trust data access:** All access to tenant and project data is enforced at the database via RLS. Application and Edge code use service role only for scoped operations; they do not bypass isolation.
- **Authentication:** Supabase Auth (JWT). Copilot and Memory APIs require valid authentication; cron and internal calls use secret-based auth.
- **Security telemetry:** Security-relevant events (prompt injection, data exfiltration attempt, rate limit, circuit open, etc.) are recorded in a dedicated table and can be used for alerting and audit.

---

## Isolation model

- **Tenant isolation:** Data is scoped by tenant_id and project_id. RLS policies ensure that users see only data for tenants/projects they belong to.
- **Service isolation:** Resilience and audit tables (rate limits, circuit breakers, leases, logs, security events) are written only by the Edge with service role; app roles have no write access and limited or no read access to these tables.

---

## AI safety controls

- **Prompt injection:** Input is checked for known injection patterns; positive cases are blocked, logged, and a safe response is returned.
- **Output validation:** LLM output is validated against a strict schema and checked for unexpected data exfiltration (e.g. new numbers); violations are blocked and logged.
- **PII:** Optional PII detection; handling (e.g. block or redact) is applied in sensitive paths.
- **Token and concurrency limits:** Per-tenant and global token budgets and lease-based concurrency prevent resource exhaustion and abuse.

---

## Resilience controls

- **Circuit breaker:** Stops calling the LLM when error rate is high; returns a deterministic fallback. A watchdog job periodically resets stuck breakers.
- **Rate limiting:** Per-tenant request-per-minute limits with atomic counters.
- **Timeouts:** LLM and retrieval calls have configurable timeouts to avoid hanging requests.
- **Retention and cleanup:** Configurable retention for logs; periodic cleanup of counters and expired leases to avoid unbounded growth.

---

## Residual risk

- **Third-party LLM:** Prompts and context are sent to the provider; provider availability and behavior affect service. We mitigate with circuit breaker, fallback, and output validation, but do not control the provider.
- **Tenant_id in request body:** Used only for rate/token/concurrency limits; data access is always governed by RLS. A malicious client could attempt to consume another tenant’s quotas if tenant_id were guessable; quota design and monitoring can reduce impact.
- **Detection-based controls:** Prompt injection and exfiltration defenses are heuristic; sophisticated attacks may occasionally evade detection. Events are logged for review and tuning.

A full threat model, data flow, incident playbooks, backup strategy, SLO definitions, and SOC2-lite mapping are available in the supporting documentation for detailed audit.
