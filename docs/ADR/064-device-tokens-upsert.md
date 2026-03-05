# ADR-064: Device tokens upsert by (tenant, user, device_id)

**Status:** Accepted  
**Decision:** Register upserts device_tokens on (tenant_id, user_id, device_id). One token per device; re-register overwrites. Unregister deletes by same key.
