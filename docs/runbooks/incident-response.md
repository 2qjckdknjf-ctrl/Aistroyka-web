# Incident Response Playbook — Aistroyka AI Platform

**Audience:** On-call, SRE, Security.  
**Use with:** threat-model.md, data-flow.md, staging-rollout-agent-rag.md.

---

## A) LLM degradation

**Detection signals:**  
- Spike in ai_llm_logs.fallback_used and fallback_reason in (timeout, rate_limit, invalid_json, schema_violation).  
- ai_circuit_breakers.state = open for key "copilot".  
- Alerts: circuit_open, or no alerts but high error rate in dashboards.

**Immediate actions:**  
1. Confirm circuit state: `SELECT * FROM ai_circuit_breakers WHERE key = 'copilot';`  
2. Check OpenAI status page and our LLM_TIMEOUT_MS / fallback_model config.  
3. If circuit open: allow 60s cooldown or run resilience-cron action `circuit_watchdog` to force half_open.  
4. If provider outage: rely on deterministic fallback and fallback_model until provider recovers; communicate to users if needed.

**Escalation:**  
- If prolonged (>30 min) or revenue-critical: escalate to platform/security; consider enabling fallback-only mode (feature flag if available).

**Rollback strategy:**  
- No code rollback for provider outage. If a recent prompt/model change correlates with degradation, consider reverting prompt version in ai_prompts (active row).

**Post-mortem checklist:**  
- Root cause (provider vs our timeout/config).  
- Whether circuit and fallback behaved as designed.  
- Adjust timeouts or fallback_model if needed.

---

## B) Circuit breaker stuck

**Detection signals:**  
- ai_circuit_breakers.state = open or half_open for >5–10 minutes with no recovery.  
- Alerts circuit_open repeated; users report “always fallback”.

**Immediate actions:**  
1. Run watchdog: POST resilience-cron with `{ "action": "circuit_watchdog" }` (x-cron-secret).  
2. Verify: `SELECT state, opened_at, last_event_at FROM ai_circuit_breakers WHERE key = 'copilot';`  
3. If still stuck: manual update to closed for recovery only after confirming LLM is healthy:  
   `UPDATE ai_circuit_breakers SET state = 'closed', opened_at = NULL, error_count = 0, success_count = 0 WHERE key = 'copilot';`

**Escalation:**  
- If watchdog is not running or cron secret misconfigured: fix cron schedule and secrets.

**Rollback strategy:**  
- Ensure resilience-cron runs every 1–5 min for circuit_watchdog; no application rollback.

**Post-mortem checklist:**  
- Why breaker stayed open (error rate vs threshold).  
- Cron and watchdog execution history.  
- Tune window_size_seconds or error threshold if needed.

---

## C) Rate limit bypass suspicion

**Detection signals:**  
- Tenant reports 429 but traffic seems within expected RPM.  
- Or: no 429 despite traffic that should exceed limits.  
- Anomalies in tenant_request_counters (e.g. one tenant with very high request_count in a window).

**Immediate actions:**  
1. Inspect counters: `SELECT * FROM tenant_request_counters ORDER BY window_start DESC LIMIT 50;`  
2. Check tenant_rate_limits for that tenant: `SELECT * FROM tenant_rate_limits WHERE tenant_id = ?;`  
3. Review ai_security_events for rate_limit_exceeded and tenant_id distribution.  
4. If bypass suspected: verify Edge is using RPC check_and_increment_tenant_request and that tenant_id in request is correct (no client spoof for data access; RLS still protects data).

**Escalation:**  
- If evidence of abuse or misconfiguration: security and product to decide on tenant_id binding (e.g. from JWT).

**Rollback strategy:**  
- Temporarily lower requests_per_minute for abusive tenant if needed; no code rollback.

**Post-mortem checklist:**  
- Whether limits are enforced per tenant as designed.  
- Document any tenant_id trust assumption and future hardening.

---

## D) Data exfiltration attempt

**Detection signals:**  
- ai_security_events.event_type = 'data_exfiltration_attempt'.  
- Alert (if configured) for exfiltration.

**Immediate actions:**  
1. Fetch event details: `SELECT * FROM ai_security_events WHERE event_type = 'data_exfiltration_attempt' ORDER BY created_at DESC LIMIT 20;`  
2. Correlate request_id with ai_llm_logs (tenant_id, user_id, mode).  
3. Confirm response was blocked (ai_llm_logs.security_blocked = true) and user received safe message.  
4. If same tenant/user repeated: consider blocking user or escalating to security for account review.

**Escalation:**  
- Security team; preserve request_id and logs for investigation.  
- If pattern suggests targeted attack: consider additional monitoring or rate limit for that tenant/user.

**Rollback strategy:**  
- No rollback; ensure exfiltration filter remains enabled.  
- If false positives: tune redactExfiltrationFromPayload rules without weakening controls.

**Post-mortem checklist:**  
- Payload that triggered block; whether it was malicious or false positive.  
- User/tenant context; any follow-up (block, notify, etc.).

---

## E) Suspicious tenant spike

**Detection signals:**  
- Single tenant_id with sudden increase in ai_llm_logs or request volume.  
- High token_usage for tenant in tenant_token_usage.  
- Many 429 (rate_limit_exceeded or concurrency_limit_exceeded) for one tenant.

**Immediate actions:**  
1. Query ai_llm_logs and ai_security_events by tenant_id for last 1–24 hours.  
2. Check tenant_request_leases and tenant_request_counters for that tenant.  
3. Determine if legitimate (e.g. batch job) or abuse.  
4. If abuse: lower tenant_rate_limits (requests_per_minute, monthly_token_limit) or contact tenant; consider lease TTL and rate limits already in place.

**Escalation:**  
- Product/customer success if legitimate; security if abuse.

**Rollback strategy:**  
- Restore higher limits after investigation if wrongly reduced.

**Post-mortem checklist:**  
- Root cause (legitimate vs abuse).  
- Whether per-tenant limits and alerts are sufficient.

---

## F) Database latency spike

**Detection signals:**  
- Supabase dashboard or logs show high DB latency.  
- ai_llm_logs.total_ms or p95 in ai_slo_daily increasing.  
- ai_security_events with event_type = 'latency_budget_exceeded' spike.

**Immediate actions:**  
1. Check run_retention_cleanup and cleanup_request_counters — ensure cron is running so tables do not grow unbounded.  
2. Check active connections and long-running queries in Supabase.  
3. If resilience tables (counters, leases, breaker) are large: run cleanup and slo_rollup manually if needed.  
4. Consider temporarily reducing load (e.g. lower RPM or concurrency) if DB is the bottleneck.

**Escalation:**  
- Platform/DB admin if index or schema change needed.

**Rollback strategy:**  
- Revert recent migrations only if they clearly caused the spike; otherwise optimize and retain data.

**Post-mortem checklist:**  
- Which queries or tables contributed.  
- Retention and cleanup schedule adequacy.  
- Index usage and need for new indexes.

---

## G) Token budget abuse

**Detection signals:**  
- Many ai_llm_logs with fallback_reason = 'tenant_budget_exceeded' or 'user_limit_exceeded'.  
- Alerts tenant_budget_exceeded.  
- One tenant or user consuming disproportionate share of global budget.

**Immediate actions:**  
1. Inspect tenant_token_usage and ai_llm_logs (tokens_used) by tenant_id and user_id for the month.  
2. Confirm monthly_token_limit and global LLM_MONTHLY_TOKEN_BUDGET are set as intended.  
3. If abuse: lower monthly_token_limit for that tenant; ensure add_tenant_token_usage is called so usage is accurate.  
4. Communicate with tenant if legitimate need for higher limit.

**Escalation:**  
- Product for limit policy; security if abuse or tenant_id spoof concern.

**Rollback strategy:**  
- Restore limits after review; no code rollback unless bug in token counting.

**Post-mortem checklist:**  
- Accuracy of token counting and budget enforcement.  
- Whether tenant_id should be bound to JWT for quota.
