# ADR-001: Rate limiting approach

**Status:** Accepted  
**Context:** High-risk endpoints need per-tenant and per-IP rate limits. Workers; no Redis.

**Decision:** Supabase table rate_limit_slots (key, window_start, count); 1-min window. Key: tenant:id:endpoint or ip:addr:endpoint. Read-then-increment in Phase 1.

**Consequences:** No new infra; slightly racy; can add atomic RPC later.
