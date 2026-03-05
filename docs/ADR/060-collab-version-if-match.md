# ADR-060: Collab annotation If-Match version

**Status:** Accepted  
**Decision:** PATCH annotation requires If-Match: <version>. Server returns 409 with current_version and current_state on mismatch. Client must refresh and retry or merge.
