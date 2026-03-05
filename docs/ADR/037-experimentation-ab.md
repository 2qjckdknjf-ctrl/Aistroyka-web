# ADR-037: Experimentation / A-B testing

**Status:** Accepted  
**Decision:** Tables experiments (key, description, variants, active) and experiment_assignments (tenant_id, user_id, experiment_key, variant). Deterministic assignment by hash(user_id). Exposure events captured into events table; no complex statistics, only data capture and docs.

**Context:** Phase 5.6; measure feature impact.

**Consequences:** Ready for A/B rollout; analysis done offline or in analytics layer.
