# ADR-049: Privacy/PII classification and policy

**Status:** Accepted  
**Decision:** Tables privacy_settings (pii_mode off|detect|enforce, redact_ai_prompts, allow_exports) and pii_findings (tenant_id, resource_type, resource_id, pii_level, types). PII types: EMAIL, PHONE, ADDRESS, PERSON_NAME, ID_NUMBER (heuristic). Classify at ingestion; apply policy: block export of high PII unless enterprise; redact AI prompts when enabled; limit sharing (docs). GET /api/v1/admin/privacy/findings?range=30d. Docs: PRIVACY-PII-POLICY.md.

**Context:** Phase 6.3; enterprise privacy.

**Consequences:** Report notes and contractor notes can be classified; findings stored for audit; policy enforced in export and AI paths.
