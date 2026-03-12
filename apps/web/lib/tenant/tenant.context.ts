/**
 * Resolve tenant context from request: auth + tenant_members -> tenantId, role, traceId, client.
 * When RBAC is available, also loads permissionSet and scopes for the user in the tenant.
 */

import { createClient, createClientFromRequest, ServiceRoleForbiddenError } from "@/lib/supabase/server";
import { getPermissionsForContext } from "@/lib/authz/authz.service";
import { getUserScopes } from "@/lib/authz/authz.repository";
import { TenantForbiddenError } from "./tenant.guard";
import type { TenantContextOrAbsent, ClientProfile } from "./tenant.types";

const DEFAULT_CLIENT: ClientProfile = "web";
const CLIENT_VALUES: ClientProfile[] = ["web", "ios_full", "ios_lite", "ios_manager", "android_full", "android_lite"];

function parseClient(header: string | null): ClientProfile {
  const v = header?.toLowerCase().trim();
  if (v && CLIENT_VALUES.includes(v as ClientProfile)) return v as ClientProfile;
  return DEFAULT_CLIENT;
}

function getTraceId(request: Request): string {
  const id = request.headers.get("x-request-id")?.trim();
  if (id) return id;
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;
}

/**
 * Derives tenant context from the request: user via Supabase server client,
 * then first tenant_members row for that user. If no user or no membership, returns absent context.
 */
export async function getTenantContextFromRequest(request: Request): Promise<TenantContextOrAbsent> {
  const traceId = getTraceId(request);
  const clientProfile = parseClient(request.headers.get("x-client"));

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClientFromRequest(request);
  } catch (e) {
    if (e instanceof ServiceRoleForbiddenError) throw new TenantForbiddenError();
    throw e;
  }
  let user: { id: string } | null = null;
  try {
    const res = await supabase.auth.getUser();
    user = res?.data?.user ?? null;
  } catch {
    return { tenantId: null, userId: null, role: null, subscriptionTier: null, clientProfile, traceId };
  }
  if (!user?.id) {
    return { tenantId: null, userId: null, role: null, subscriptionTier: null, clientProfile, traceId };
  }

  const tenantId = await getActiveTenantId(supabase, user.id);
  if (!tenantId) {
    return { tenantId: null, userId: user.id, role: null, subscriptionTier: null, clientProfile, traceId };
  }

  const role = await getRoleInTenant(supabase, tenantId, user.id);
  if (!role) {
    return { tenantId: null, userId: user.id, role: null, subscriptionTier: null, clientProfile, traceId };
  }

  const base = {
    tenantId,
    userId: user.id,
    role,
    subscriptionTier: "free",
    clientProfile,
    traceId,
  };
  try {
    const [permissionSet, scopes] = await Promise.all([
      getPermissionsForContext(supabase, base),
      getUserScopes(supabase, tenantId, user.id),
    ]);
    return { ...base, permissionSet, scopes };
  } catch {
    return base;
  }
}

async function getActiveTenantId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data: ownTenant } = await supabase.from("tenants").select("id").eq("user_id", userId).maybeSingle();
  if (ownTenant?.id) return ownTenant.id;
  const { data: member } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", userId).limit(1).maybeSingle();
  return member?.tenant_id ?? null;
}

const ROLES = ["owner", "admin", "member", "viewer"] as const;
type DbRole = (typeof ROLES)[number];

async function getRoleInTenant(supabase: Awaited<ReturnType<typeof createClient>>, tenantId: string, userId: string): Promise<DbRole | null> {
  const { data: tenant } = await supabase.from("tenants").select("user_id").eq("id", tenantId).maybeSingle();
  if (tenant?.user_id === userId) return "owner";
  const { data: member } = await supabase.from("tenant_members").select("role").eq("tenant_id", tenantId).eq("user_id", userId).maybeSingle();
  const r = member?.role;
  if (typeof r === "string" && ROLES.includes(r as DbRole)) return r as DbRole;
  return null;
}
