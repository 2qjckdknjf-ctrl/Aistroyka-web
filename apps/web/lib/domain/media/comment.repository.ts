import type { SupabaseClient } from "@supabase/supabase-js";

export interface PhotoComment {
  id: string;
  tenant_id: string;
  media_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
}

export async function createComment(
  supabase: SupabaseClient,
  tenantId: string,
  mediaId: string,
  authorUserId: string,
  body: string
): Promise<PhotoComment | null> {
  const { data: row, error } = await supabase
    .from("photo_comments")
    .insert({
      tenant_id: tenantId,
      media_id: mediaId,
      author_user_id: authorUserId,
      body: body.trim(),
    })
    .select("id, body, author_user_id, created_at")
    .single();

  if (error || !row) return null;
  return row as PhotoComment;
}

export async function listCommentsByMedia(
  supabase: SupabaseClient,
  mediaId: string,
  tenantId: string
): Promise<PhotoComment[]> {
  const { data, error } = await supabase
    .from("photo_comments")
    .select("*")
    .eq("media_id", mediaId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PhotoComment[];
}
