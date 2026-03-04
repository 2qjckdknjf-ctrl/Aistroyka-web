# ADR-003: ai_usage schema

**Status:** Accepted  
**Decision:** Tables ai_usage (tenant_id, tokens, cost_usd, status, ...) and tenant_billing_state (tenant_id, period, spent_usd). Check quota before AI; record usage and addSpent after. addSpent non-atomic in Phase 1.
