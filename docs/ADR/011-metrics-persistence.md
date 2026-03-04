# ADR-011: Metrics persistence choice

**Status:** Accepted  
**Decision:** tenant_daily_metrics table holds minimal aggregates (ai_calls, ai_cost_usd, jobs_processed, jobs_failed, uploads, active_workers) per tenant per day. Admin endpoints can read from ai_usage and jobs when tenant_daily_metrics not yet populated. Backfill or write from processor in Phase 3.

**Consequences:** Single place for dashboard; flexible read path during rollout.
