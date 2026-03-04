import type { SupabaseClient } from "@supabase/supabase-js";
import type { Media } from "./media.types";

export async function listByProject(
  supabase: SupabaseClient,
  projectId: string,
  tenantId: string
): Promise<Media[]> {
  const { data, error } = await supabase
    .from("media")
    .select("id, project_id, tenant_id, type, file_url, uploaded_at")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .order("uploaded_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Media[];
}

export async function getById(
  supabase: SupabaseClient,
  mediaId: string,
  tenantId: string
): Promise<Media | null> {
  const { data, error } = await supabase
    .from("media")
    .select("id, project_id, tenant_id, type, file_url, uploaded_at")
    .eq("id", mediaId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Media;
}
