# ADR-008: Idempotency strategy

**Status:** Accepted  
**Decision:** Mobile sends x-idempotency-key header on report submit and upload finalize. Server stores (key, tenant_id, user_id, route, response, status_code, expires_at). Same key returns cached response. TTL 24h; cleanup strategy documented (periodic delete where expires_at < now()).

**Consequences:** Prevents duplicate report submit and duplicate finalize on retry.
