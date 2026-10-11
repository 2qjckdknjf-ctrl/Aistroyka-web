import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";

export const PORTAL_INTAKE_TENANT_HEADER = "x-tenant-id";
const ACTIVE_TENANT_COOKIE = "aistroyka_active_tenant";

export const INTERNAL_INTAKE_ROLES = ["owner", "admin", "member", "viewer"] as const;

function cookieValue(header: string | null, name: string): { present: boolean; value: string } | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    const raw = trimmed.slice(eq + 1).trim();
    try {
      return { present: true, value: decodeURIComponent(raw) };
    } catch {
      return { present: true, value: "" };
    }
  }
  return null;
}

export function readExplicitTenantClaim(request: Request): { present: boolean; value: string } {
  if (request.headers.has(PORTAL_INTAKE_TENANT_HEADER)) {
    return { present: true, value: request.headers.get(PORTAL_INTAKE_TENANT_HEADER)?.trim() ?? "" };
  }
  const fromCookie = cookieValue(request.headers.get("cookie"), ACTIVE_TENANT_COOKIE);
  if (fromCookie?.present) return { present: true, value: fromCookie.value.trim() };
  return { present: false, value: "" };
}

export async function resolvePortalIntakeTenant(
  supabase: SupabaseClient,
  ctx: TenantContext,
  request: Request,
  projectId: string | null | undefined
): Promise<{ tenantId: string } | { error: string; status: number }> {
  const claim = readExplicitTenantClaim(request);
  if (claim.present) {
    if (!claim.value) {
      return { error: "x-tenant-id is required", status: 400 };
    }
    const allowed = await callerHasExplicitTenantAccess(supabase, ctx.userId, claim.value);
    if (!allowed) return { error: "Insufficient rights", status: 403 };
    return { tenantId: claim.value };
  }

  if (projectId) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, tenant_id")
      .eq("id", projectId)
      .maybeSingle();
    if (error) return { error: "Project lookup failed", status: 400 };
    if (!data?.tenant_id) return { error: "Project not found", status: 404 };
    const allowed = await callerHasExplicitTenantAccess(supabase, ctx.userId, String(data.tenant_id));
    if (!allowed) return { error: "Insufficient rights", status: 403 };
    return { tenantId: String(data.tenant_id) };
  }

  if (ctx.role !== "stakeholder") {
    return { tenantId: ctx.tenantId };
  }

  // Customer iOS is stakeholder-only and does not send x-tenant-id.
  // A single active portal grant is unambiguous. Several grants stay fail-closed.
  const sole = await soleActivePortalTenant(supabase, ctx.userId);
  if ("error" in sole) return sole;
  if (sole.tenantId) return { tenantId: sole.tenantId };

  return {
    error: "x-tenant-id or project_id is required for portal intake",
    status: 400,
  };
}

export function intakeProjectHintFromUrl(request: Request): string | null {
  let raw: string | null;
  try {
    raw = new URL(request.url).searchParams.get("project_id");
  } catch {
    return null;
  }
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

async function callerHasExplicitTenantAccess(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string
): Promise<boolean> {
  if (await isInternalTenantPrincipal(supabase, userId, tenantId)) return true;
  return hasActivePortalGrantInTenant(supabase, userId, tenantId);
}

async function isInternalTenantPrincipal(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string
): Promise<boolean> {
  const { data: owned } = await supabase.from("tenants").select("id").eq("id", tenantId).eq("user_id", userId).maybeSingle();
  if (owned?.id) return true;
  const { data: member } = await supabase
    .from("tenant_members")
    .select("id, role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  const role = typeof member?.role === "string" ? member.role : "";
  return INTERNAL_INTAKE_ROLES.includes(role as (typeof INTERNAL_INTAKE_ROLES)[number]);
}

async function hasActivePortalGrantInTenant(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string
): Promise<boolean> {
  const { data: grant } = await supabase
    .from("project_stakeholders")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return Boolean(grant?.id);
}

async function soleActivePortalTenant(
  supabase: SupabaseClient,
  userId: string
): Promise<{ tenantId: string | null } | { error: string; status: number }> {
  const { data, error } = await supabase
    .from("project_stakeholders")
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) return { error: "Portal tenant lookup failed", status: 400 };
  const tenantIds = new Set<string>();
  for (const row of data ?? []) {
    const tenantId = typeof row.tenant_id === "string" ? row.tenant_id.trim() : "";
    if (tenantId) tenantIds.add(tenantId);
  }
  if (tenantIds.size !== 1) return { tenantId: null };
  return { tenantId: [...tenantIds][0] ?? null };
}
