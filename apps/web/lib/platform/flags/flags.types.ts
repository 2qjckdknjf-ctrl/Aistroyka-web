/**
 * Feature flag types. Keys are global; tenant overrides and rollout control visibility.
 */

export interface FeatureFlagRow {
  key: string;
  description: string | null;
  rollout_percent: number | null;
  allowlist_tenant_ids: string[] | null;
  created_at: string;
}

export interface TenantFeatureFlagRow {
  tenant_id: string;
  key: string;
  enabled: boolean;
  variant: string | null;
  updated_at: string;
}

export interface ConfigPayload {
  flags: Record<string, { enabled: boolean; variant?: string | null }>;
  limits?: Record<string, number>;
  serverTime: string;
  traceId: string;
  clientProfile: string;
}
