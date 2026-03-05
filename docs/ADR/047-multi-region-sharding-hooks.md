# ADR-047: Multi-region and tenant sharding (foundation + hooks)

**Status:** Accepted  
**Decision:** Table tenant_data_plane (tenant_id, region eu|us|me|apac, shard). Routing abstraction: region.service (getRegionForTenant), shard.service (getShardForTenant), data-plane.router (getDataPlane). For now single data plane; router returns connectionHint "default". Interfaces designed so adding another Supabase project later is feasible (connectionHint maps to client). Docs: MULTI-REGION-SHARDING-PLAN.md (routing, migration, tenant move, risks).

**Context:** Phase 6.1; EU/US separation and future sharding.

**Consequences:** Repositories can call getDataPlane(tenantId) and use connectionHint when multi-DB exists; no change to existing single-DB code paths until second plane is added.
