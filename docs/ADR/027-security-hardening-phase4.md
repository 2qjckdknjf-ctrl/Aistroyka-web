# ADR-027: Security hardening (Phase 4.8)

**Status:** Accepted  
**Decision:** (1) Media upload request size limit 25MB (Content-Length and file size). (2) Debug/diag endpoints in production require DEBUG_* and request Host in ALLOW_DEBUG_HOSTS. (3) Job process endpoint already protected by tenant + jobs:process scope + rate limit. (4) Login rate-limited and structured-logged; audit_logs not used for login (no tenant pre-auth). (5) CSRF stance documented: same-site cookies; idempotency keys for writes. (6) Security headers centralized in lib/security-headers and verified by unit test.

**Context:** Phase 4.8 attack surface reduction and abuse mitigation.

**Consequences:** Production debug/diag must set ALLOW_DEBUG_HOSTS explicitly. Large uploads rejected with 413.
