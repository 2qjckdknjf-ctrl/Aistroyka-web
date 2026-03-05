# ADR-019: API deprecation policy

**Status:** Accepted  
**Decision:** Legacy endpoints (non-/api/v1/) return Deprecation: true, Sunset: (date), and Link: </api/v1/...>; rel="successor" where applicable. v1 is stable; breaking changes require v2. Policy documented in docs/API-RELEASE-POLICY.md. No removal of legacy routes in Phase 3; marking only.

**Context:** Phase 3.6 release governance; clients need to migrate to v1 without surprise removal.

**Consequences:** New legacy routes should apply the same headers; v1 contract changes remain additive-only.
