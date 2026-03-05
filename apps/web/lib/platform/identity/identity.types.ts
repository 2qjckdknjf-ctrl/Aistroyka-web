/**
 * Enterprise identity types (OIDC/SAML).
 */

export type IdentityProviderType = "oidc" | "saml";

export interface IdentityProviderRow {
  tenant_id: string;
  type: IdentityProviderType;
  issuer: string | null;
  client_id: string | null;
  metadata: Record<string, unknown> | null;
  enabled: boolean;
  created_at: string;
}

export interface SsoSessionRow {
  id: string;
  tenant_id: string;
  state: string;
  nonce: string | null;
  created_at: string;
  expires_at: string;
}
