import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "./project.types";

export async function listByTenant(supabase: SupabaseClient, tenantId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, tenant_id, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Project[];
}

export async function getById(supabase: SupabaseClient, projectId: string, tenantId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, tenant_id, created_at")
    .eq("id", projectId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Project;
}

export async function create(supabase: SupabaseClient, tenantId: string, name: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ tenant_id: tenantId, name: name.trim() })
    .select("id, name, tenant_id, created_at")
    .single();
  if (error || !data) return null;
  return data as Project;
}

export async function listByIds(
  supabase: SupabaseClient,
  tenantId: string,
  projectIds: string[]
): Promise<Project[]> {
  const ids = [...new Set(projectIds)].filter(Boolean);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, tenant_id, created_at")
    .eq("tenant_id", tenantId)
    .in("id", ids);
  if (error) return [];
  return (data ?? []) as Project[];
}

export async function listByUserMembership(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<Project[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  if (error) return [];
  const ids = (data ?? [])
    .map((row) => (row as { project_id?: string }).project_id)
    .filter((id): id is string => typeof id === "string");
  return listByIds(supabase, tenantId, ids);
}

export async function updateClientPortalSettings(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string,
  input: { client_portal_enabled?: boolean; client_show_budget_summary?: boolean }
): Promise<{ client_portal_enabled: boolean | null; client_show_budget_summary: boolean | null } | null> {
  const patch: Record<string, unknown> = {};
  if (input.client_portal_enabled !== undefined) {
    patch.client_portal_enabled = input.client_portal_enabled;
  }
  if (input.client_show_budget_summary !== undefined) {
    patch.client_show_budget_summary = input.client_show_budget_summary;
  }
  if (Object.keys(patch).length === 0) return null;
  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", projectId)
    .eq("tenant_id", tenantId)
    .select("client_portal_enabled, client_show_budget_summary")
    .maybeSingle();
  if (error || !data) return null;
  return data as { client_portal_enabled: boolean | null; client_show_budget_summary: boolean | null };
}
