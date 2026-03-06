import type { SupabaseClient } from "@supabase/supabase-js";

export interface PushOutboxRow {
  id: string;
  tenant_id: string;
  user_id: string;
  platform: string;
  type: string;
  status: string;
  attempts: number;
  last_error: string | null;
  next_retry_at: string | null;
  created_at: string;
}

/**
 * List push outbox for tenant (admin only). RLS enforces owner/admin.
 */
export async function listPushOutbox(
  supabase: SupabaseClient,
  tenantId: string,
  opts: { status?: string; from?: string; to?: string; limit?: number; offset?: number } = {}
): Promise<{ rows: PushOutboxRow[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 200);
  const offset = Math.max(0, opts.offset ?? 0);

  let query = supabase
    .from("push_outbox")
    .select("id, tenant_id, user_id, platform, type, status, attempts, last_error, next_retry_at, created_at", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.from) query = query.gte("created_at", opts.from);
  if (opts.to) query = query.lte("created_at", opts.to);

  const { data, error, count } = await query;
  if (error) return { rows: [], total: 0 };
  return { rows: (data ?? []) as PushOutboxRow[], total: count ?? 0 };
}
