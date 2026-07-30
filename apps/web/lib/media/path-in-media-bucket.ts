/**
 * Upload-session `object_path` is stored with a logical `media/` bucket prefix
 * (e.g. `media/{tenant}/{session}/file.jpg`). Supabase Storage APIs and public
 * URLs already select the `media` bucket, so the prefix must be stripped before
 * use — otherwise paths become `media/media/...` and 404.
 */
export function pathInMediaBucket(objectPath: string): string {
  return objectPath.startsWith("media/") ? objectPath.slice("media/".length) : objectPath;
}

/** Build a public object URL for a media-bucket path (accepts prefixed or bare paths). */
export function publicMediaObjectUrl(supabaseBaseUrl: string, objectPath: string): string {
  const base = supabaseBaseUrl.replace(/\/$/, "");
  const path = pathInMediaBucket(objectPath);
  return `${base}/storage/v1/object/public/media/${path}`;
}
