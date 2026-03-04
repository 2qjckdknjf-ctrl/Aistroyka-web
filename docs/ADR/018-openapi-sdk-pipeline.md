# ADR-018: Contracts → OpenAPI → SDK pipeline

**Status:** Accepted  
**Decision:** Generate OpenAPI 3.0 spec from @aistroyka/contracts Zod schemas via packages/contracts-openapi (zod-to-json-schema + hand-written paths). Artifact: dist/openapi.json. Provide typed TypeScript client in packages/api-client (createClient, fetcher, types re-export). Mobile: document OpenAPI Generator for Swift (iOS) and Kotlin (Android); no generated mobile code in repo.

**Context:** Phase 3.5 requirement for SDK and mobile-ready API definitions without maintaining a separate OpenAPI file by hand.

**Consequences:** Single source of truth (Zod) for request/response shapes; OpenAPI used for docs and codegen. API client is additive; v1 contract stability preserved.
