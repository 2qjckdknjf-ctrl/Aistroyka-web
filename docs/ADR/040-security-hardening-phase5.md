# ADR-040: Security hardening (Phase 5.9)

**Status:** Accepted  
**Decision:** Bot detection: simple heuristic + rate limits (existing rate-limit.service). Auth: progressive delays and suspicious IP alerts (login rate limit and audit). Upload: strict MIME allowlist and max size per tier (existing request-limit and upload size checks). Export job throttling and concurrency caps (tenant_concurrency). No new heavy implementation; document and extend existing controls.

**Context:** Phase 5.9; abuse, fraud, bot mitigation.

**Consequences:** Documented in REPORT-PHASE5; implementation leans on Phase 4.8 and existing rate-limit/audit.
