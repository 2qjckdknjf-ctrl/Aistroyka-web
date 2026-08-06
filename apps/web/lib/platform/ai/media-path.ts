/**
 * Shared media-bucket path helpers for AI image resolution and report media URLs.
 * Upload sessions store object_path as `media/{tenantId}/{sessionId}/...` (bucket name prefix).
 * Storage APIs expect the path relative to the bucket (without leading `media/`).
 *
 * Authorization lives in media-path-tenant-guard.ts — always run assertMediaPathTenantScope
 * before createSignedUrl.
 */

import { MEDIA_BUCKET } from "./media-bucket.constants";
import {
  extractAndNormalizeStorageUrlPath,
  normalizeMediaObjectPath,
} from "./media-path-tenant-guard";

export { MEDIA_BUCKET };

/** Strip leading `media/` so the path is relative to the Storage bucket. */
export function pathInMediaBucket(objectPath: string): string {
  const normalized = normalizeMediaObjectPath(objectPath);
  if (normalized.ok) return normalized.bucketRelativePath;
  // Best-effort legacy strip for display helpers; callers that sign MUST use the guard.
  const trimmed = objectPath.trim().replace(/^\/+/, "");
  let path = trimmed;
  while (path === MEDIA_BUCKET || path.startsWith(`${MEDIA_BUCKET}/`)) {
    if (path === MEDIA_BUCKET) return "";
    path = path.slice(MEDIA_BUCKET.length + 1);
  }
  return path;
}

/** True when path looks like a storage object reference (not an http URL). */
export function isStorageObjectPath(value: string): boolean {
  const v = value.trim();
  if (!v || /^https?:\/\//i.test(v)) return false;
  const normalized = normalizeMediaObjectPath(v);
  return normalized.ok;
}

/**
 * Extract bucket-relative path from our Supabase Storage public/signed/authenticated URL.
 * Returns null for external or unrecognized URLs. Never throws.
 */
export function extractMediaPathFromStorageUrl(
  url: string,
  supabaseUrl: string
): string | null {
  const result = extractAndNormalizeStorageUrlPath(url, supabaseUrl);
  if (!result) return null;
  if (!result.ok) return null;
  return result.bucketRelativePath;
}

/** Build a public object URL (legacy display). Prefer signed URLs for AI providers. */
export function publicMediaObjectUrl(supabaseUrl: string, objectPath: string): string {
  const relative = pathInMediaBucket(objectPath);
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${relative}`;
}
