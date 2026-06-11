import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { AppError } from "@/lib/rpc";

/**
 * Upload a file to a Supabase Storage bucket.
 * Client-only (File is a browser type).
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  opts?: { upsert?: boolean }
): Promise<{ path: string }> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: opts?.upsert ?? false });

  if (error) {
    throw new AppError(error.message, {
      code: "STORAGE_ERROR",
      context: { bucket, path, cause: error },
    });
  }

  return { path: data.path };
}
