import type { SupabaseClient } from "@supabase/supabase-js";

export interface MediaCollabData {
  annotations: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    version: number;
    author_user_id: string;
    created_at: string;
    updated_at: string | null;
  }>;
  comments: Array<{
    id: string;
    body: string;
    author_user_id: string;
    created_at: string;
  }>;
}

export async function getMediaCollab(
  supabase: SupabaseClient,
  mediaId: string,
  tenantId: string
): Promise<MediaCollabData> {
  const [annRes, comRes] = await Promise.all([
    supabase
      .from("photo_annotations")
      .select("id, type, data, version, author_user_id, created_at, updated_at")
      .eq("tenant_id", tenantId)
      .eq("media_id", mediaId)
      .order("created_at"),
    supabase
      .from("photo_comments")
      .select("id, body, author_user_id, created_at")
      .eq("tenant_id", tenantId)
      .eq("media_id", mediaId)
      .order("created_at"),
  ]);

  return {
    annotations: (annRes.data ?? []) as MediaCollabData["annotations"],
    comments: (comRes.data ?? []) as MediaCollabData["comments"],
  };
}
