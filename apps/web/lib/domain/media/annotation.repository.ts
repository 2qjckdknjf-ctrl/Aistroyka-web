import type { SupabaseClient } from "@supabase/supabase-js";

export interface PhotoAnnotation {
  id: string;
  tenant_id: string;
  media_id: string;
  author_user_id: string;
  type: string;
  data: Record<string, unknown>;
  version: number;
  created_at: string;
}

export async function createAnnotation(
  supabase: SupabaseClient,
  tenantId: string,
  mediaId: string,
  authorUserId: string,
  type: string,
  data: Record<string, unknown>
): Promise<PhotoAnnotation | null> {
  const { data: row, error } = await supabase
    .from("photo_annotations")
    .insert({
      tenant_id: tenantId,
      media_id: mediaId,
      author_user_id: authorUserId,
      type,
      data,
      version: 1,
    })
    .select("id, type, data, version, created_at")
    .single();

  if (error || !row) return null;
  return row as PhotoAnnotation;
}

export async function getAnnotationById(
  supabase: SupabaseClient,
  annotationId: string,
  tenantId: string
): Promise<PhotoAnnotation | null> {
  const { data, error } = await supabase
    .from("photo_annotations")
    .select("*")
    .eq("id", annotationId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PhotoAnnotation;
}

export async function updateAnnotation(
  supabase: SupabaseClient,
  annotationId: string,
  tenantId: string,
  data: Record<string, unknown>
): Promise<PhotoAnnotation | null> {
  const { data: row, error } = await supabase
    .from("photo_annotations")
    .update({ data, version: supabase.raw("version + 1") })
    .eq("id", annotationId)
    .eq("tenant_id", tenantId)
    .select("*")
    .maybeSingle();

  if (error || !row) return null;
  return row as PhotoAnnotation;
}

export async function deleteAnnotation(
  supabase: SupabaseClient,
  annotationId: string,
  tenantId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("photo_annotations")
    .delete()
    .eq("id", annotationId)
    .eq("tenant_id", tenantId);

  return !error;
}

export async function listAnnotationsByMedia(
  supabase: SupabaseClient,
  mediaId: string,
  tenantId: string
): Promise<PhotoAnnotation[]> {
  const { data, error } = await supabase
    .from("photo_annotations")
    .select("*")
    .eq("media_id", mediaId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PhotoAnnotation[];
}
