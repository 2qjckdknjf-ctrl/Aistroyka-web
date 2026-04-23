import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StakeholderDeliverySummary,
  StakeholderNotificationPublic,
  StakeholderNotificationRow,
} from "./stakeholder-notifications.types";

const ROW =
  "id, tenant_id, project_id, recipient_user_id, recipient_email, kind, status, channel, payload, stakeholder_invite_id, client_request_id, email_attempted_at, email_delivered_at, read_at, created_at, updated_at";

function kindToCopy(kind: StakeholderNotificationRow["kind"], payload: Record<string, unknown>): { title: string; body: string | null } {
  switch (kind) {
    case "stakeholder_invite_sent":
      return {
        title: "Project invitation",
        body: typeof payload.invite_hint === "string" ? payload.invite_hint : "You were invited to the client portal.",
      };
    case "stakeholder_invite_reminder":
      return {
        title: "Reminder: invitation pending",
        body: "Your invitation is still waiting. Open the link from your email to continue.",
      };
    case "client_request_new":
      return {
        title: typeof payload.title === "string" ? String(payload.title) : "Action requested",
        body:
          typeof payload.instructions === "string" && payload.instructions.trim()
            ? String(payload.instructions).slice(0, 500)
            : "Your input is needed on this project.",
      };
    case "client_request_reminder":
      return {
        title: `Reminder: ${typeof payload.title === "string" ? payload.title : "open request"}`,
        body: "This request is still open — please respond when you can.",
      };
    default:
      return { title: "Update", body: null };
  }
}

export function rowToPublic(r: StakeholderNotificationRow): StakeholderNotificationPublic {
  const { title, body } = kindToCopy(r.kind, r.payload ?? {});
  return {
    id: r.id,
    kind: r.kind,
    title,
    body,
    read_at: r.read_at,
    created_at: r.created_at,
    client_request_id: r.client_request_id,
    stakeholder_invite_id: r.stakeholder_invite_id,
    email_delivered_at: r.email_delivered_at,
  };
}

export async function insertNotification(
  supabase: SupabaseClient,
  row: {
    tenant_id: string;
    project_id: string;
    recipient_user_id: string | null;
    recipient_email: string;
    kind: StakeholderNotificationRow["kind"];
    status: StakeholderNotificationRow["status"];
    channel: StakeholderNotificationRow["channel"];
    payload: Record<string, unknown>;
    stakeholder_invite_id?: string | null;
    client_request_id?: string | null;
    email_attempted_at?: string | null;
    email_delivered_at?: string | null;
  }
): Promise<StakeholderNotificationRow | null> {
  const { data, error } = await supabase
    .from("stakeholder_notifications")
    .insert({
      tenant_id: row.tenant_id,
      project_id: row.project_id,
      recipient_user_id: row.recipient_user_id,
      recipient_email: row.recipient_email.trim().toLowerCase(),
      kind: row.kind,
      status: row.status,
      channel: row.channel,
      payload: row.payload,
      stakeholder_invite_id: row.stakeholder_invite_id ?? null,
      client_request_id: row.client_request_id ?? null,
      email_attempted_at: row.email_attempted_at ?? null,
      email_delivered_at: row.email_delivered_at ?? null,
    })
    .select(ROW)
    .single();
  if (error || !data) return null;
  return data as StakeholderNotificationRow;
}

export async function updateNotification(
  supabase: SupabaseClient,
  id: string,
  tenantId: string,
  patch: Partial<Pick<StakeholderNotificationRow, "status" | "email_attempted_at" | "email_delivered_at" | "read_at">>
): Promise<boolean> {
  const { error } = await supabase
    .from("stakeholder_notifications")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  return !error;
}

export async function listForUser(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string,
  opts: { limit?: number } = {}
): Promise<StakeholderNotificationRow[]> {
  const limit = Math.min(opts.limit ?? 50, 100);
  const { data, error } = await supabase
    .from("stakeholder_notifications")
    .select(ROW)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as StakeholderNotificationRow[];
}

export async function unreadCount(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("stakeholder_notifications")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("recipient_user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function markRead(
  supabase: SupabaseClient,
  id: string,
  tenantId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("stakeholder_notifications")
    .update({
      read_at: new Date().toISOString(),
      status: "read",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("recipient_user_id", userId);
  return !error;
}

export async function listDeliveryForProject(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  opts: { limit?: number } = {}
): Promise<StakeholderDeliverySummary[]> {
  const limit = Math.min(opts.limit ?? 100, 200);
  const { data, error } = await supabase
    .from("stakeholder_notifications")
    .select(ROW)
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => {
    const row = r as StakeholderNotificationRow;
    return {
      id: row.id,
      kind: row.kind,
      recipient_email: row.recipient_email,
      recipient_user_id: row.recipient_user_id,
      status: row.status,
      email_delivered_at: row.email_delivered_at,
      read_at: row.read_at,
      created_at: row.created_at,
      client_request_id: row.client_request_id,
      stakeholder_invite_id: row.stakeholder_invite_id,
      payload: row.payload ?? {},
    };
  });
}

export async function hasRecentReminderForRequest(
  supabase: SupabaseClient,
  tenantId: string,
  clientRequestId: string,
  kind: "client_request_reminder",
  sinceIso: string
): Promise<boolean> {
  const { count } = await supabase
    .from("stakeholder_notifications")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("client_request_id", clientRequestId)
    .eq("kind", kind)
    .gte("created_at", sinceIso);
  return (count ?? 0) > 0;
}

export async function hasRecentInviteReminder(
  supabase: SupabaseClient,
  tenantId: string,
  inviteId: string,
  sinceIso: string
): Promise<boolean> {
  const { count } = await supabase
    .from("stakeholder_notifications")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("stakeholder_invite_id", inviteId)
    .eq("kind", "stakeholder_invite_reminder")
    .gte("created_at", sinceIso);
  return (count ?? 0) > 0;
}
