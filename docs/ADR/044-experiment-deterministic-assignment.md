# ADR-044: Experiment deterministic assignment

**Status:** Accepted  
**Decision:** Experiment variant assigned by hash(user_id) so same user gets same variant. experiment_assignments stores (tenant_id, user_id, experiment_key, variant). No server-side stats; capture exposure in events for later analysis.

**Context:** Phase 5.6 A-B.
