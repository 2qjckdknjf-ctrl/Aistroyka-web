# ADR-043: Events insert via service_role only

**Status:** Accepted  
**Decision:** events table RLS: select for tenant admin; insert with check (false) so only service_role can insert. App emits events via getAdminClient() in handlers/routes. Prevents client abuse.

**Context:** Phase 5.5 event stream.
