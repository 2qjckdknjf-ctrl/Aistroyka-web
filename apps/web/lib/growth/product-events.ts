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

const ACTIVATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type ProductAuditRow = {
  user_id: string | null;
  action: string;
  created_at: string;
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

function isCoreAction(action: string): boolean {
  return action === "task_assignment" || action === "report_submit" || action === "report_review";
}

/**
 * Activation from stored audit rows only.
 * The core action must happen at or after that user's first login and within 7 days.
 * `rate` stays null until at least one usable login timestamp exists.
 */
export function activationBaseline(rows: readonly ProductAuditRow[]): ActivationBaseline {
  const firstLogin = new Map<string, number>();
  for (const row of rows) {
    if (!row.user_id || row.action !== "login") continue;
    const at = Date.parse(row.created_at);
    if (Number.isNaN(at)) continue;
    const previous = firstLogin.get(row.user_id);
    if (previous === undefined || at < previous) firstLogin.set(row.user_id, at);
  }
  const activated = new Set<string>();
  for (const row of rows) {
    if (!row.user_id || !isCoreAction(row.action)) continue;
    const loginAt = firstLogin.get(row.user_id);
    if (loginAt === undefined) continue;
    const at = Date.parse(row.created_at);
    if (Number.isNaN(at) || at < loginAt || at - loginAt > ACTIVATION_WINDOW_MS) continue;
    activated.add(row.user_id);
  }
  return {
    loginUsers: firstLogin.size,
    activatedUsers: activated.size,
    rate: firstLogin.size === 0 ? null : activated.size / firstLogin.size,
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

async function loginAlreadyRecorded(
  admin: SupabaseClient,
  tenantId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("audit_logs")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("action", "login")
    .limit(1);
  return Array.isArray(data) && data.length > 0;
}

/**
 * Best-effort first login row in audit_logs. Does not throw and stores no email.
 * Pass the service-role client when the caller may run more than once (mobile
 * activation status); the first stored login is kept.
 */
export async function recordLoginSuccess(
  supabase: SupabaseClient,
  userId: string,
  clientHeader: string | null,
  admin?: SupabaseClient | null,
): Promise<void> {
  try {
    const workspace = await resolveWorkspace(supabase, userId);
    if (!workspace) return;
    if (admin && (await loginAlreadyRecorded(admin, workspace.tenantId, userId))) return;
    await emitAudit(admin ?? supabase, {
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
