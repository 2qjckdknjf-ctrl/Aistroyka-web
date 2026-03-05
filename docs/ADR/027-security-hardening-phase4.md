# ADR-027: Security hardening (Phase 4.8)

**Status:** Accepted  
**Decision:** Apply strict request body size limit (1 MB) on media-related endpoints (upload-sessions, finalize). Login already has stricter rate limit (Phase 3.7). Job processing endpoint requires authorize(ctx, "jobs:process") and tenant scope. Debug endpoints require DEBUG_* and ALLOW_DEBUG_HOSTS (existing). Document CSRF stance (same-site cookies; no custom token for current same-origin/mobile Bearer usage). Add security headers verification test (expected header names).

**Context:** Phase 4.8 attack surface reduction and abuse mitigation.

**Consequences:** 413 on oversized media body; debug routes return 404 when not allowed. Security headers are applied in middleware; test documents expectations.
