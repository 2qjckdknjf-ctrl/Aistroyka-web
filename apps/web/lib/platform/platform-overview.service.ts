import type { SupabaseClient } from "@supabase/supabase-js";

export type PlatformSupportEvent = {
  id: string;
  subject: string | null;
  status: string;
  priority: string | null;
  created_at: string;
  tenant_id: string | null;
};

export type PlatformOverviewSnapshot = {
  connected: boolean;
  error: string | null;
  totalTenants: number | null;
  activeUsers: number | null;
  pendingInvites: number | null;
  openSupportEvents: number | null;
  totalProjects: number | null;
  recentSupportEvents: PlatformSupportEvent[] | null;
};

export type PushOutboxHealthSnapshot = {
  connected: boolean;
  error: string | null;
  pendingCount: number | null;
  failedCount: number | null;
  sentCount24h: number | null;
};

export type BillingPlatformSnapshot = {
  connected: boolean;
  error: string | null;
  entitlementsRowCount: number | null;
  billingCustomersCount: number | null;
};

type SupportTicketRow = {
  id: string;
  subject: string | null;
  status: string;
  priority: string | null;
  created_at: string;
  tenant_id: string | null;
};

/** Shared read-only platform overview metrics (GET /api/v1/platform/overview). */
export async function getPlatformOverviewSnapshot(
  admin: SupabaseClient
): Promise<PlatformOverviewSnapshot> {
  try {
    const db = admin as SupabaseClient & {
      from: (table: string) => ReturnType<SupabaseClient["from"]>;
    };

    const [tenants, members, tenantOwners, pendingInvites, openSupport, unresolvedSupport, projects] =
      await Promise.all([
        admin.from("tenants").select("id", { count: "exact", head: true }),
        admin.from("tenant_members").select("user_id"),
        admin.from("tenants").select("user_id"),
        admin
          .from("tenant_invitations")
          .select("id", { count: "exact", head: true })
          .gt("expires_at", new Date().toISOString()),
        db
          .from("support_tickets")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "waiting_user"]),
        db
          .from("support_tickets")
          .select("id, subject, status, priority, created_at, tenant_id")
          .in("status", ["open", "in_progress", "waiting_user"])
          .order("updated_at", { ascending: false })
          .limit(10),
        admin.from("projects").select("id", { count: "exact", head: true }),
      ]);

    const memberRows = (members.data ?? []) as Array<{ user_id: string }>;
    const ownerRows = (tenantOwners.data ?? []) as Array<{ user_id: string | null }>;

    return {
      connected: true,
      error: null,
      totalTenants: tenants.count ?? 0,
      activeUsers: new Set([
        ...memberRows.map((row) => row.user_id),
        ...ownerRows.map((row) => row.user_id).filter(Boolean),
      ]).size,
      pendingInvites: pendingInvites.count ?? 0,
      openSupportEvents: openSupport.count ?? 0,
      totalProjects: projects.count ?? 0,
      recentSupportEvents: (unresolvedSupport.data ?? []) as SupportTicketRow[],
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "platform_overview_error",
      totalTenants: null,
      activeUsers: null,
      pendingInvites: null,
      openSupportEvents: null,
      totalProjects: null,
      recentSupportEvents: null,
    };
  }
}

/** Platform-wide push outbox delivery health (service role). */
export async function getPushOutboxHealthSnapshot(
  admin: SupabaseClient
): Promise<PushOutboxHealthSnapshot> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [pending, failed, sent24h] = await Promise.all([
      admin
        .from("push_outbox")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "retry"]),
      admin.from("push_outbox").select("id", { count: "exact", head: true }).eq("status", "failed"),
      admin
        .from("push_outbox")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("created_at", since),
    ]);

    return {
      connected: true,
      error: null,
      pendingCount: pending.count ?? 0,
      failedCount: failed.count ?? 0,
      sentCount24h: sent24h.count ?? 0,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "push_outbox_error",
      pendingCount: null,
      failedCount: null,
      sentCount24h: null,
    };
  }
}

/** Platform billing inventory (entitlements + billing_customers counts). */
export async function getBillingPlatformSnapshot(
  admin: SupabaseClient
): Promise<BillingPlatformSnapshot> {
  try {
    const [entitlements, billingCustomers] = await Promise.all([
      admin.from("entitlements").select("tenant_id", { count: "exact", head: true }),
      admin.from("billing_customers").select("tenant_id", { count: "exact", head: true }),
    ]);

    return {
      connected: true,
      error: null,
      entitlementsRowCount: entitlements.count ?? 0,
      billingCustomersCount: billingCustomers.count ?? 0,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "billing_platform_error",
      entitlementsRowCount: null,
      billingCustomersCount: null,
    };
  }
}
