import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrgRole } from "./org.types";

const ORG_ADMIN_ROLES: OrgRole[] = ["org_owner", "org_admin"];

/** Check if user has org_admin or org_owner for the organization. */
export async function hasOrgAdminRole(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("org_role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return ORG_ADMIN_ROLES.includes((data as { org_role: string }).org_role as OrgRole);
}

/** List tenant IDs linked to the organization. */
export async function getTenantIdsForOrg(
  supabase: SupabaseClient,
  organizationId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("organization_tenants")
    .select("tenant_id")
    .eq("organization_id", organizationId);
  if (error || !data) return [];
  return (data as { tenant_id: string }[]).map((r) => r.tenant_id);
}

/** List organizations the user belongs to (for header/context). */
export async function getOrganizationIdsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);
  if (error || !data) return [];
  return (data as { organization_id: string }[]).map((r) => r.organization_id);
}
