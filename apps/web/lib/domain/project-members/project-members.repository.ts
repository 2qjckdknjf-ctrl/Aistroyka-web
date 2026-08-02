import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectMemberRole } from "./project-members.types";

export type { ProjectMemberRole };

/** Get project membership with role. Returns null if not a member. */
export async function getMembership(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string
): Promise<{ role: ProjectMemberRole } | null> {
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data) return null;
  const role = (data as { role?: string }).role;
  if (typeof role === "string" && ["worker", "contractor", "manager", "owner"].includes(role)) {
    return { role: role as ProjectMemberRole };
  }
  return null;
}

/** Add project member. Idempotent (ignores conflict). */
export async function addMember(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string,
  userId: string,
  role: ProjectMemberRole
): Promise<void> {
  await supabase.from("project_members").upsert(
    { tenant_id: tenantId, project_id: projectId, user_id: userId, role, status: "active" },
    { onConflict: "tenant_id,project_id,user_id" }
  );
}

/** List user IDs with role=owner for a project. */
export async function getProjectOwnerIds(
  supabase: SupabaseClient,
  tenantId: string,
  projectId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("role", "owner")
    .eq("status", "active");
  if (error || !data) return [];
  return (data as { user_id: string }[]).map((r) => r.user_id);
}

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
