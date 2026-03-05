# SLO / SLA Definition — Aistroyka AI Platform

**Purpose:** Operational targets for availability, latency, errors, and AI-specific metrics. Adjust numbers per environment and contract.

---

## Availability target

- **Target:** 99.9% (e.g. successful Copilot responses as proportion of total requests, excluding client-side cancellations).  
- **Measurement:** (Total requests − 5xx − timeouts that result in 5xx or no response) / Total requests over the window.  
- **Exclusions:** 429 (rate/concurrency limit) and 400 (bad request) count as “handled”, not availability failure. Provider outages that we mitigate with fallback still count as success for SLA if we return 200 with fallback.

---

## p95 latency target

- **Target:** p95 total request time ≤ 8000 ms (8 s).  
- **Measurement:** ai_llm_logs.total_ms (or latency_ms) per (tenant_id, mode) or global; percentile 95 over the window.  
- **Breach:** Events with total_ms > 8000 logged in ai_security_events as latency_budget_exceeded (low severity).  
- **Dashboard:** ai_slo_daily.p95_ms.

---

## Error rate budget

- **Target:** Error rate (fallback_used or 5xx) ≤ 5% of requests (configurable).  
- **Measurement:** ai_llm_logs: count(fallback_used = true or error_category not null) / count(*).  
- **Budget:** Can define monthly or weekly budget; alerts when threshold exceeded.

---

## Breaker open rate threshold

- **Target:** circuit_open events and time-in-open should stay below threshold (e.g. < 5 opens per hour per environment, or < 1% of minutes with breaker open).  
- **Measurement:** ai_security_events where event_type = 'circuit_open'; or ai_circuit_breakers state history if logged.  
- **Action:** Tune circuit window and error ratio; ensure watchdog runs so breaker does not stay stuck open.

---

## Retrieval low-confidence threshold

- **Target:** Proportion of retrieval calls with low_confidence (no or low-quality chunks) below threshold (e.g. < 20%).  
- **Measurement:** ai_retrieval_logs: count(low_confidence = true) / count(*) per tenant or project over the window.  
- **Dashboard:** ai_slo_daily.retrieval_low_confidence_rate.  
- **Action:** Improve embeddings or data quality; adjust threshold if too strict.

---

## Token budget breach tolerance

- **Target:** Per-tenant and global token budgets enforced; “breach” = requests that hit tenant_budget_exceeded or global budget fallback.  
- **Tolerance:** Acceptable rate of such fallbacks (e.g. < 2% of requests, or zero for critical tenants).  
- **Measurement:** ai_llm_logs.fallback_reason = 'tenant_budget_exceeded' (and global budget) / total.  
- **Action:** Adjust monthly_token_limit or global budget; communicate with tenant if legitimate need.
