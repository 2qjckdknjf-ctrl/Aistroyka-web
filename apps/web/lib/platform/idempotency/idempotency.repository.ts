import type { SupabaseClient } from "@supabase/supabase-js";

export async function getCached(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string
): Promise<{ response: unknown; status_code: number } | null> {
  const { data, error } = await supabase
    .from("idempotency_keys")
    .select("response, status_code, expires_at")
    .eq("key", key)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("route", route)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { response: unknown; status_code: number; expires_at: string };
  if (new Date(row.expires_at) < new Date()) return null;
  return { response: row.response, status_code: row.status_code };
}

export async function store(
  supabase: SupabaseClient,
  key: string,
  tenantId: string,
  userId: string,
  route: string,
  response: unknown,
  statusCode: number,
  ttlHours: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  await supabase.from("idempotency_keys").upsert(
    {
      key,
      tenant_id: tenantId,
      user_id: userId,
      route,
      response,
      status_code: statusCode,
      expires_at: expiresAt,
    },
    { onConflict: "key" }
  );
}
