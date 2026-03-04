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
