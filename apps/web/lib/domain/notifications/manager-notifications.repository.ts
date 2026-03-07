import type { SupabaseClient } from "@supabase/supabase-js";

export interface ManagerNotificationRow {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
}

/**
 * List notifications for a user in a tenant (inbox). Paginated.
 */
export async function listForUser(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<{ data: ManagerNotificationRow[]; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const offset = Math.max(0, opts.offset ?? 0);

  const countQuery = supabase
    .from("manager_notifications")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);

  const dataQuery = supabase
    .from("manager_notifications")
    .select("id, tenant_id, user_id, type, title, body, read_at, target_type, target_id, created_at")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);
  const total = countRes.count ?? 0;
  const data = (dataRes.data ?? []) as ManagerNotificationRow[];
  return { data, total };
}

/**
 * Mark notification as read. Returns true if updated (and row belonged to tenant+user).
 */
export async function markRead(
  supabase: SupabaseClient,
  notificationId: string,
  tenantId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("manager_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  return !error;
}

const MANAGER_ROLES = ["owner", "admin", "member"];

export interface CreateManagerNotificationInput {
  type: string;
  title: string;
  body?: string | null;
  target_type?: string | null;
  target_id?: string | null;
}

/**
 * Insert one notification per tenant manager (owner, admin, member). Best-effort; does not throw.
 */
export async function notifyTenantManagers(
  supabase: SupabaseClient,
  tenantId: string,
  input: CreateManagerNotificationInput
): Promise<void> {
  try {
    const { data: members } = await supabase
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .in("role", MANAGER_ROLES);
    if (!members?.length) return;
    const userIds = [...new Set((members as { user_id: string }[]).map((m) => m.user_id))];
    await supabase.from("manager_notifications").insert(
      userIds.map((user_id) => ({
        tenant_id: tenantId,
        user_id,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        target_type: input.target_type ?? null,
        target_id: input.target_id ?? null,
      }))
    );
  } catch {
    // Best-effort
  }
}
