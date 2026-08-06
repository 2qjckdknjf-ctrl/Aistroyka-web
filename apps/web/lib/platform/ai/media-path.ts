/**
 * Shared media-bucket path helpers for AI image resolution and report media URLs.
 * Upload sessions store object_path as `media/{tenantId}/{sessionId}/...` (bucket name prefix).
 * Storage APIs expect the path relative to the bucket (without leading `media/`).
 */

export const MEDIA_BUCKET = "media";

/** Strip leading `media/` so the path is relative to the Storage bucket. */
export function pathInMediaBucket(objectPath: string): string {
  const trimmed = objectPath.trim().replace(/^\/+/, "");
  return trimmed.startsWith(`${MEDIA_BUCKET}/`)
    ? trimmed.slice(MEDIA_BUCKET.length + 1)
    : trimmed;
}

/** True when path looks like a storage object reference (not an http URL). */
export function isStorageObjectPath(value: string): boolean {
  const v = value.trim();
  if (!v || /^https?:\/\//i.test(v)) return false;
  if (v.includes("..")) return false;
  return v.startsWith(`${MEDIA_BUCKET}/`) || /^[0-9a-f-]{36}\//i.test(v) || v.includes("/");
}

/**
 * Extract bucket-relative path from our Supabase Storage public/signed URL.
 * Returns null for external or unrecognized URLs.
 */
export function extractMediaPathFromStorageUrl(
  url: string,
  supabaseUrl: string
): string | null {
  const trimmed = url.trim();
  if (!trimmed || !supabaseUrl) return null;
  let base: string;
  try {
    base = new URL(supabaseUrl).origin;
  } catch {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.origin !== base) return null;

  const publicPrefix = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const signPrefix = `/storage/v1/object/sign/${MEDIA_BUCKET}/`;
  const authenticatedPrefix = `/storage/v1/object/authenticated/${MEDIA_BUCKET}/`;

  const path = parsed.pathname;
  let objectPath: string | null = null;
  if (path.startsWith(publicPrefix)) {
    objectPath = decodeURIComponent(path.slice(publicPrefix.length));
  } else if (path.startsWith(signPrefix)) {
    objectPath = decodeURIComponent(path.slice(signPrefix.length));
  } else if (path.startsWith(authenticatedPrefix)) {
    objectPath = decodeURIComponent(path.slice(authenticatedPrefix.length));
  }
  if (!objectPath) return null;
  // Drop signed-url query junk if somehow in pathname; keep object key only.
  const q = objectPath.indexOf("?");
  if (q >= 0) objectPath = objectPath.slice(0, q);
  if (!objectPath || objectPath.includes("..")) return null;
  return pathInMediaBucket(objectPath);
}

/** Build a public object URL (legacy display). Prefer signed URLs for AI providers. */
export function publicMediaObjectUrl(supabaseUrl: string, objectPath: string): string {
  const relative = pathInMediaBucket(objectPath);
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${relative}`;
}
