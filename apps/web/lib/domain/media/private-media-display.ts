import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAIMediaImage, type ResolveAIMediaImageInput } from "@/lib/platform/ai/resolve-ai-media-image";

/** Internal previews only. Customer publication uses the current-access gateway. */
export async function privateMediaDisplayUrl(client: SupabaseClient, input: ResolveAIMediaImageInput): Promise<string | null> {
  const result = await resolveAIMediaImage(client, input);
  if (result.ok) return result.imageUrl;
  if (result.retryable) throw new Error("Private media preview temporarily unavailable");
  return null;
}
