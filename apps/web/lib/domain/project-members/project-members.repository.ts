import type { SupabaseClient } from "@supabase/supabase-js";

/** Check if user is a member of the project (any role, active). */
export async function isProjectMember(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return !error && !!data;
}

/** List project IDs the user is a member of (for worker/contractor scoping). */
export async function getProjectIdsForUser(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("status", "active");
  if (error || !data) return [];
  return (data as { project_id: string }[]).map((r) => r.project_id);
}
