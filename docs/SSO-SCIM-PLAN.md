# SSO and SCIM plan

## Overview

- **Login:** Password (existing Supabase) and OIDC for enterprise tenants. SAML later.
- **Identity mapping:** Link by email + provider subject (OIDC sub) to Supabase users.
- **SCIM:** Endpoint skeleton at `/api/v1/scim/*`; returns 501 until enabled and implemented.

## OIDC flow

1. Tenant has `identity_providers` row with type=oidc, issuer, client_id, enabled=true.
2. App redirects to IdP auth URL with state (stored in `sso_sessions`) and nonce.
3. Callback: verify state, exchange code for tokens, map subject+email to user (create or link).
4. `oidc.service`: getOidcProvider, saveSsoState, consumeSsoState.

## SAML

- Stub only. Table supports type=saml; full implementation in a later phase.

## SCIM

- Env: `SCIM_ENABLED=true`, `SCIM_TOKEN` (Bearer). Endpoints: `/api/v1/scim/Users`, `/api/v1/scim/Groups` return 501 with "SCIM not implemented".
- Future: user/group provisioning and deprovisioning per tenant.

## Data

- `identity_providers`: tenant_id, type (oidc|saml), issuer, client_id, metadata, enabled.
- `sso_sessions`: id, tenant_id, state, nonce, expires_at. Used for OIDC state validation.
