import type { SupabaseClient } from "@supabase/supabase-js";
import { emitAudit } from "@/lib/observability/audit.service";
import { pickPrimaryTenantMembership } from "@/lib/tenant/tenant-membership-priority";

const CLIENTS = new Set([
  "web",
  "ios_full",
  "ios_lite",
  "ios_worker",
  "ios_manager",
  "android_full",
  "android_lite",
  "android_worker",
  "android_manager",
]);

const ROLES = new Set(["owner", "admin", "member", "viewer", "stakeholder"]);

export type ProductAuditRow = {
  user_id: string | null;
  action: string;
};

export type ActivationBaseline = {
  loginUsers: number;
  activatedUsers: number;
  /** Null when no login rows exist. Never invent a rate from an empty sample. */
  rate: number | null;
};

export function categoricalToken(value: string | null | undefined, allowed: ReadonlySet<string>): string | null {
  if (!value) return null;
  const token = value.trim().toLowerCase();
  if (!token || token.includes("@") || token.length > 32) return null;
  return allowed.has(token) ? token : null;
}

export function loginAuditDetails(input: {
  client?: string | null;
  role?: string | null;
}): Record<string, string> {
  const details: Record<string, string> = {};
  const client = categoricalToken(input.client, CLIENTS);
  const role = categoricalToken(input.role, ROLES);
  if (client) details.client = client;
  if (role) details.role = role;
  return details;
}

/**
 * Activation from stored audit rows only.
 * A user counts as activated after `login` plus `task_assignment` or `report_submit`.
 * `rate` stays null until at least one login row exists.
 */
export function activationBaseline(rows: readonly ProductAuditRow[]): ActivationBaseline {
  const loginUsers = new Set<string>();
  const coreUsers = new Set<string>();
  for (const row of rows) {
    if (!row.user_id) continue;
    if (row.action === "login") loginUsers.add(row.user_id);
    if (row.action === "task_assignment" || row.action === "report_submit") coreUsers.add(row.user_id);
  }
  let activatedUsers = 0;
  for (const userId of loginUsers) {
    if (coreUsers.has(userId)) activatedUsers += 1;
  }
  return {
    loginUsers: loginUsers.size,
    activatedUsers,
    rate: loginUsers.size === 0 ? null : activatedUsers / loginUsers.size,
  };
}

async function resolveWorkspace(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ tenantId: string; role: string } | null> {
  const { data: ownTenant } = await supabase.from("tenants").select("id").eq("user_id", userId).maybeSingle();
  if (ownTenant && typeof ownTenant.id === "string") {
    return { tenantId: ownTenant.id, role: "owner" };
  }
  const { data: members } = await supabase.from("tenant_members").select("tenant_id, role").eq("user_id", userId);
  const primary = pickPrimaryTenantMembership(members ?? []);
  if (!primary) return null;
  return { tenantId: primary.tenant_id, role: primary.role };
}

/** Best-effort login row in audit_logs. Does not throw and stores no email. */
export async function recordLoginSuccess(
  supabase: SupabaseClient,
  userId: string,
  clientHeader: string | null,
): Promise<void> {
  try {
    const workspace = await resolveWorkspace(supabase, userId);
    if (!workspace) return;
    await emitAudit(supabase, {
      tenant_id: workspace.tenantId,
      user_id: userId,
      action: "login",
      resource_type: "session",
      details: loginAuditDetails({ client: clientHeader ?? "web", role: workspace.role }),
    });
  } catch {
    return;
  }
}
