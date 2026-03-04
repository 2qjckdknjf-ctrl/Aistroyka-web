import type { SupabaseClient } from "@supabase/supabase-js";
import type { Permission } from "./authz.types";

const ROLE_NAME_TO_ID: Record<string, string> = {
  OWNER: "00000000-0000-0000-0000-000000000001",
  MANAGER: "00000000-0000-0000-0000-000000000002",
  WORKER: "00000000-0000-0000-0000-000000000003",
  CONTRACTOR: "00000000-0000-0000-0000-000000000004",
};

/** Load permission keys for a role by name. Uses seeded role ids. */
export async function getPermissionsForRoleName(
  supabase: SupabaseClient,
  roleName: string
): Promise<Permission[]> {
  const roleId = ROLE_NAME_TO_ID[roleName];
  if (!roleId) return [];
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId);
  if (error || !data?.length) return [];
  const ids = (data as { permission_id: string }[]).map((r) => r.permission_id);
  const { data: perms } = await supabase.from("permissions").select("key").in("id", ids);
  return ((perms ?? []) as { key: string }[]).map((p) => p.key as Permission);
}

/** Load user scopes for tenant/user. */
export async function getUserScopes(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_scopes")
    .select("scope")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  if (error || !data) return [];
  return (data as { scope: string }[]).map((r) => r.scope);
}
