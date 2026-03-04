# ADR-006: Legacy adapter strategy

**Status:** Accepted  
**Context:** Phase 1 must not break existing `/api/*` routes; `/api/v1` is the canonical evolution path.

**Decision:** Keep all legacy routes. Where v1 and legacy overlap (e.g. projects, AI analyze), both use the same domain services or the same handler. Legacy `/api/projects` calls `listProjects` and `createProject` from domain; `/api/v1/projects` re-exports the same handlers. `/api/v1/ai/analyze-image` re-exports the same POST as `/api/ai/analyze-image`, so rate limit and quota apply to both when tenant is present. New capabilities (worker, upload session) exist only under v1.

**Consequences:** No duplicated business logic; legacy clients unchanged; new clients use v1.
