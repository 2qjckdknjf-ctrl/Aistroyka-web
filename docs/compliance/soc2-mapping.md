# SOC2-lite Compliance Mapping — Aistroyka AI Platform

**Purpose:** Map platform controls to SOC2-style trust service criteria for enterprise audit.  
**Classification:** Internal / Customer-facing (high level).

---

## Access control (CC6.1)

| Control | Implementation |
|---------|-----------------|
| Logical access | Supabase Auth (JWT). All API access to Copilot and Memory requires valid JWT or anon where allowed. |
| Data isolation | RLS on all tenant/project tables; policies bound to `tenant_members` / `project_members` and `auth.uid()`. No using(true) for app data. |
| Service-to-DB | Edge functions use `SUPABASE_SERVICE_ROLE_KEY`; key stored in secrets; no client access to service role. |
| Cron | `resilience-cron` protected by `x-cron-secret` (CRON_SECRET); no other caller. |

**Evidence:** RLS policies in migrations (e.g. 20260302120000_rls_enterprise_final.sql, 20260302162000_ai_security_events_and_flags.sql); JWT validation at Edge entry.

---

## Change management (CC8.1)

| Control | Implementation |
|---------|-----------------|
| Code changes | Version-controlled in git; changes via commits and pull requests. |
| Deployments | CI/CD (e.g. Vercel, Supabase) builds and deploys from repo; no manual production code edits. |
| Schema / config | Migrations in repo; applied via Supabase migration pipeline. Edge secrets (env) set in platform; no secrets in repo. |

**Evidence:** Git history; CI config; migration files.

---

## Logging & monitoring (CC7.2, CC7.3)

| Control | Implementation |
|---------|-----------------|
| Request audit | Every Copilot request logged in `ai_llm_logs` (request_id, tenant_id, mode, tokens_used, latency, fallback_reason, etc.). |
| Security events | `ai_security_events`: rate_limit_exceeded, prompt_injection, pii_detected, circuit_open, data_exfiltration_attempt, latency_budget_exceeded, tenant_budget_exceeded. |
| SLO rollups | `ai_slo_daily`: daily aggregates from ai_llm_logs, ai_security_events, ai_retrieval_logs for availability, latency, error rate, breaker, retrieval quality. |
| Alerts | Optional outbound webhook (ALERT_WEBHOOK_URL); deduplication via ai_alert_dedup (throttle per event_type + tenant_id). |

**Evidence:** Table definitions and indexes (20260302162000, 20260302180200, 20260302190000); Edge logging code.

---

## Incident management (A1.2, CC7.4)

| Control | Implementation |
|---------|-----------------|
| Process | Documented in docs/runbooks/incident-response.md. |
| Scenarios | LLM degradation, circuit breaker stuck, rate limit bypass suspicion, data exfiltration attempt, suspicious tenant spike, database latency spike, token budget abuse. |
| Detection / actions / escalation / rollback / post-mortem | Defined per scenario in the playbook. |

**Evidence:** incident-response.md.

---

## Data retention (CC6.6)

| Control | Implementation |
|---------|-----------------|
| Retention policy | Configurable retention for ai_llm_logs, ai_security_events, ai_retrieval_logs via run_retention_cleanup (RETENTION_DAYS_*). |
| Cleanup | resilience-cron runs retention when configured; cleanup_request_counters and cleanup_expired_leases for resilience tables. |
| Backup / RTO-RPO | Documented in docs/security/backup-restore.md; Supabase PITR per plan. |

**Evidence:** 20260302189000_retention_cleanup_functions.sql; backup-restore.md.

---

## Availability (A1.1)

| Control | Implementation |
|---------|-----------------|
| Resilience | Circuit breaker (ai_circuit_breakers) to stop cascading LLM failures; fallback response when open. |
| Rate limiting | Per-tenant requests_per_minute (tenant_rate_limits + tenant_request_counters) to prevent overload. |
| Concurrency | Lease-based (tenant_request_leases) with TTL to cap in-flight requests per tenant. |
| Recovery | Circuit watchdog (heal_circuit_breakers) via resilience-cron; no sticky state on crash. |

**Evidence:** threat-model.md; data-flow.md; resilience migrations (20260302180000–20260302188000).

---

## Security events (CC7.2)

| Control | Implementation |
|---------|-----------------|
| Security telemetry | Table ai_security_events; event_type and details; request_id, tenant_id, project_id for correlation. |
| Types | rate_limit_exceeded, prompt_injection, pii_detected, circuit_open, data_exfiltration_attempt, latency_budget_exceeded, tenant_budget_exceeded (and any added for alerts). |
| Access | RLS: SELECT for project/tenant members; INSERT for service role only. |

**Evidence:** 20260302162000_ai_security_events_and_flags.sql; 20260302186000_resilience_indexes.sql; Edge insert code.
