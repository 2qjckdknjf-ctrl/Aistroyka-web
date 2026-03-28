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
  project_id: string | null;
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
    .select("id, tenant_id, user_id, type, title, body, read_at, target_type, target_id, project_id, created_at")
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
 * Unread count for a user in a tenant.
 */
export async function unreadCount(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("manager_notifications")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
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

/**
 * Mark all notifications as read for a user in a tenant.
 */
export async function markAllRead(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("manager_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .is("read_at", null)
    .select("id");
  return error ? 0 : (data?.length ?? 0);
}

const MANAGER_ROLES = ["owner", "admin", "member"];

export interface CreateManagerNotificationInput {
  type: string;
  title: string;
  body?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  project_id?: string | null;
}

async function insertNotifications(
  supabase: SupabaseClient,
  tenantId: string,
  userIds: string[],
  input: CreateManagerNotificationInput
): Promise<void> {
  if (userIds.length === 0) return;
  await supabase.from("manager_notifications").insert(
    userIds.map((user_id) => ({
      tenant_id: tenantId,
      user_id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      target_type: input.target_type ?? null,
      target_id: input.target_id ?? null,
      project_id: input.project_id ?? null,
    }))
  );
}

/**
 * Insert one notification per project manager (project_members.role in ('manager', 'owner') for that project).
 * Use when project_id is known and only project managers should be notified.
 */
export async function notifyProjectManagers(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  input: CreateManagerNotificationInput
): Promise<void> {
  try {
    const { data } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .in("role", ["manager", "owner"])
      .eq("status", "active");
    const userIds = [...new Set((data ?? []).map((r: { user_id: string }) => r.user_id))];
    if (userIds.length === 0) {
      await notifyTenantManagers(supabase, tenantId, { ...input, project_id: projectId });
      return;
    }
    await insertNotifications(supabase, tenantId, userIds, { ...input, project_id: projectId });
  } catch {
    await notifyTenantManagers(supabase, tenantId, { ...input, project_id: projectId });
  }
}

/**
 * Insert one notification per project owner (project_members.role=owner for that project).
 * Use when project_id is known and only project owners should be notified.
 */
export async function notifyProjectOwners(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  input: CreateManagerNotificationInput
): Promise<void> {
  try {
    const { data } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .eq("role", "owner")
      .eq("status", "active");
    const userIds = [...new Set((data ?? []).map((r: { user_id: string }) => r.user_id))];
    if (userIds.length === 0) {
      await notifyOwnerSide(supabase, tenantId, input);
      return;
    }
    await insertNotifications(supabase, tenantId, userIds, { ...input, project_id: projectId });
  } catch {
    await notifyOwnerSide(supabase, tenantId, input);
  }
}

/**
 * Insert one notification per tenant owner-side user (tenant owner + tenant_members with role=owner).
 * Used when no project context or as fallback when project has no owners.
 */
export async function notifyOwnerSide(
  supabase: SupabaseClient,
  tenantId: string,
  input: CreateManagerNotificationInput
): Promise<void> {
  try {
    const ownerIds = new Set<string>();

    const { data: tenant } = await supabase
      .from("tenants")
      .select("user_id")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenant?.user_id) ownerIds.add((tenant as { user_id: string }).user_id);

    const { data: ownerMembers } = await supabase
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .eq("role", "owner");
    for (const m of ownerMembers ?? []) {
      ownerIds.add((m as { user_id: string }).user_id);
    }

    const userIds = [...ownerIds];
    if (userIds.length === 0) {
      await notifyTenantManagers(supabase, tenantId, input);
      return;
    }
    await insertNotifications(supabase, tenantId, userIds, input);
  } catch {
    await notifyTenantManagers(supabase, tenantId, input);
  }
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
    await insertNotifications(supabase, tenantId, userIds, input);
  } catch {
    // Best-effort
  }
}
