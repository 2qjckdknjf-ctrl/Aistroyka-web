import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeatureFlagRow, TenantFeatureFlagRow } from "./flags.types";

export async function listFlags(supabase: SupabaseClient): Promise<FeatureFlagRow[]> {
  const { data, error } = await supabase
    .from("feature_flags")
    .select("key, description, rollout_percent, allowlist_tenant_ids, created_at")
    .order("key");
  if (error) return [];
  return (data ?? []) as FeatureFlagRow[];
}

export async function getTenantOverrides(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TenantFeatureFlagRow[]> {
  const { data, error } = await supabase
    .from("tenant_feature_flags")
    .select("tenant_id, key, enabled, variant, updated_at")
    .eq("tenant_id", tenantId);
  if (error) return [];
  return (data ?? []) as TenantFeatureFlagRow[];
}

/** Require service_role for write. */
export async function upsertFlag(
  supabase: SupabaseClient,
  row: { key: string; description?: string | null; rollout_percent?: number | null; allowlist_tenant_ids?: string[] | null }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("feature_flags").upsert(
    {
      key: row.key,
      description: row.description ?? null,
      rollout_percent: row.rollout_percent ?? null,
      allowlist_tenant_ids: row.allowlist_tenant_ids ?? null,
    },
    { onConflict: "key" }
  );
  return { error: error?.message ?? null };
}

export async function setTenantFlag(
  supabase: SupabaseClient,
  tenantId: string,
  key: string,
  enabled: boolean,
  variant?: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("tenant_feature_flags").upsert(
    {
      tenant_id: tenantId,
      key,
      enabled,
      variant: variant ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,key" }
  );
  return { error: error?.message ?? null };
}
