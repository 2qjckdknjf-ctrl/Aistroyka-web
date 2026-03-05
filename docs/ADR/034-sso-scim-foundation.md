# ADR-034: SSO (OIDC) and SCIM foundation

**Status:** Accepted  
**Decision:** Identity tables: identity_providers (tenant_id, type oidc|saml, issuer, client_id, metadata, enabled), sso_sessions (state, nonce, expires). OIDC service: getOidcProvider, saveSsoState, consumeSsoState. Login supports password (existing) and OIDC for enterprise tenants; map by email + provider subject. SAML stub only. SCIM: /api/v1/scim/* returns 501 unless SCIM_ENABLED and SCIM_TOKEN set; skeleton for future provisioning. docs/SSO-SCIM-PLAN.md.

**Context:** Phase 5.3; enterprise onboarding.

**Consequences:** OIDC flow can be wired to Supabase or custom callback; SCIM ready for later implementation.
