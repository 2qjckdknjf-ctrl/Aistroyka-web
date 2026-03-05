# ADR-032: Feature flags and configurable rollout

**Status:** Accepted  
**Decision:** Feature flag platform with `feature_flags` (key, description, rollout_percent, allowlist_tenant_ids) and `tenant_feature_flags` (tenant_id, key, enabled, variant). Evaluation order: explicit tenant override > allowlist > percentage rollout (hash of tenant_id) > off. GET /api/v1/config returns flags, serverTime, traceId, clientProfile for current tenant (or flags off when unauthenticated). Admin: GET/POST /api/v1/admin/flags, POST /api/v1/admin/tenants/:id/flags; permission admin:read / admin:write; audited.

**Context:** Phase 5.1; safe rollout for web/iOS/Android.

**Consequences:** Clients can read config once per session; staged rollout without code deploy. admin:write added to tenant policy for flag management.
