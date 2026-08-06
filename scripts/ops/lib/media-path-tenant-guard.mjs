/**
 * Pure media path tenant guard (ESM).
 * Keep behavior in sync with apps/web/lib/platform/ai/media-path-tenant-guard.ts
 * — parity covered by media-path-tenant-guard.parity.test.ts
 */

export const MEDIA_BUCKET = "media";

export const AI_MEDIA_ACCESS_DENIED = "AI_MEDIA_ACCESS_DENIED";
export const AI_MEDIA_CORRUPT_REFERENCE = "AI_MEDIA_CORRUPT_REFERENCE";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return UUID_RE.test(value);
}

export function hasMalformedPercentEncoding(value) {
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== "%") continue;
    const h1 = value[i + 1];
    const h2 = value[i + 2];
    if (!h1 || !h2 || !/[0-9a-fA-F]/.test(h1) || !/[0-9a-fA-F]/.test(h2)) {
      return true;
    }
    i += 2;
  }
  return false;
}

export function safeDecodePath(raw) {
  if (typeof raw !== "string") return null;
  let current = raw;
  for (let round = 0; round < 3; round++) {
    if (hasMalformedPercentEncoding(current)) return null;
    if (!/%[0-9a-fA-F]{2}/.test(current)) break;
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      return null;
    }
  }
  if (hasMalformedPercentEncoding(current)) return null;
  return current;
}

export function normalizeMediaObjectPath(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, code: AI_MEDIA_CORRUPT_REFERENCE, reason: "Empty storage path" };
  }
  if (raw.includes("\0") || raw.includes("\\")) {
    return { ok: false, code: AI_MEDIA_CORRUPT_REFERENCE, reason: "Invalid path characters" };
  }
  const decoded = safeDecodePath(raw.trim());
  if (decoded == null) {
    return { ok: false, code: AI_MEDIA_CORRUPT_REFERENCE, reason: "Malformed path encoding" };
  }
  if (decoded.includes("\0") || decoded.includes("\\")) {
    return {
      ok: false,
      code: AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Invalid path characters after decode",
    };
  }
  if (/\s/.test(decoded)) {
    return { ok: false, code: AI_MEDIA_CORRUPT_REFERENCE, reason: "Whitespace in storage path" };
  }
  let pathOnly = decoded.split("?")[0].split("#")[0];
  pathOnly = pathOnly.replace(/\/+/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!pathOnly) {
    return { ok: false, code: AI_MEDIA_CORRUPT_REFERENCE, reason: "Empty storage path" };
  }
  while (pathOnly === MEDIA_BUCKET || pathOnly.startsWith(`${MEDIA_BUCKET}/`)) {
    if (pathOnly === MEDIA_BUCKET) {
      return { ok: false, code: AI_MEDIA_CORRUPT_REFERENCE, reason: "Bucket-only path" };
    }
    pathOnly = pathOnly.slice(MEDIA_BUCKET.length + 1);
  }
  const segments = pathOnly.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) {
    return {
      ok: false,
      code: AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Path traversal or empty segment",
    };
  }
  return { ok: true, bucketRelativePath: segments.join("/") };
}

export function assertMediaPathTenantScope(rawPath, tenantId, projectId) {
  if (!tenantId || !isUuid(tenantId)) {
    return { ok: false, code: AI_MEDIA_ACCESS_DENIED, reason: "Invalid tenant scope" };
  }
  const normalized = normalizeMediaObjectPath(rawPath);
  if (!normalized.ok) return normalized;
  const path = normalized.bucketRelativePath;
  const tenantPrefix = `${tenantId}/`;
  const underTenant = path.startsWith(tenantPrefix) && path.length > tenantPrefix.length;
  let underProject = false;
  if (projectId && isUuid(projectId)) {
    const projectPrefix = `${projectId}/`;
    underProject = path.startsWith(projectPrefix) && path.length > projectPrefix.length;
  }
  if (!underTenant && !underProject) {
    return {
      ok: false,
      code: AI_MEDIA_ACCESS_DENIED,
      reason: "Storage path outside tenant scope",
    };
  }
  return { ok: true, bucketRelativePath: path };
}

export function extractAndNormalizeStorageUrlPath(url, supabaseUrl) {
  if (typeof url !== "string" || !url.trim() || !supabaseUrl) return null;
  const trimmed = url.trim();
  // Object paths are not URLs — callers normalize via normalizeMediaObjectPath.
  if (!/^https?:\/\//i.test(trimmed)) return null;
  let baseOrigin;
  try {
    baseOrigin = new URL(supabaseUrl).origin;
  } catch {
    return null;
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, code: AI_MEDIA_CORRUPT_REFERENCE, reason: "Malformed storage URL" };
  }
  if (parsed.origin !== baseOrigin) return null;
  const prefixes = [
    `/storage/v1/object/public/${MEDIA_BUCKET}/`,
    `/storage/v1/object/sign/${MEDIA_BUCKET}/`,
    `/storage/v1/object/authenticated/${MEDIA_BUCKET}/`,
  ];
  let encodedObjectPath = null;
  for (const prefix of prefixes) {
    if (parsed.pathname.startsWith(prefix)) {
      encodedObjectPath = parsed.pathname.slice(prefix.length);
      break;
    }
  }
  if (!encodedObjectPath) return null;
  return normalizeMediaObjectPath(encodedObjectPath);
}

/**
 * Classify whether a media.file_url / object path is safe to recover for a tenant.
 * Never returns the foreign path string to callers for logging.
 */
export function classifyMediaFileUrlForTenant(fileUrl, tenantId, projectId, supabaseUrl) {
  if (typeof fileUrl !== "string" || !fileUrl.trim()) {
    return { resolvable: false, reason: "empty_file_url", security_rejected: false };
  }
  const trimmed = fileUrl.trim();
  const fromUrl = supabaseUrl
    ? extractAndNormalizeStorageUrlPath(trimmed, supabaseUrl)
    : null;
  if (fromUrl) {
    if (!fromUrl.ok) {
      return {
        resolvable: false,
        reason: fromUrl.code === AI_MEDIA_ACCESS_DENIED ? "path_access_denied" : "corrupt_reference",
        security_rejected: fromUrl.code === AI_MEDIA_ACCESS_DENIED,
      };
    }
    const scope = assertMediaPathTenantScope(fromUrl.bucketRelativePath, tenantId, projectId);
    if (!scope.ok) {
      return {
        resolvable: false,
        reason: "poisoned_cross_tenant_path",
        security_rejected: true,
      };
    }
    return { resolvable: true, reason: "media_storage_url", bucketRelativePath: scope.bucketRelativePath };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { resolvable: false, reason: "external_url", security_rejected: false };
  }

  const scope = assertMediaPathTenantScope(trimmed, tenantId, projectId);
  if (!scope.ok) {
    const security =
      scope.code === AI_MEDIA_ACCESS_DENIED ||
      scope.reason.includes("traversal") ||
      scope.reason.includes("encoding");
    return {
      resolvable: false,
      reason: scope.code === AI_MEDIA_ACCESS_DENIED ? "poisoned_cross_tenant_path" : "corrupt_reference",
      security_rejected: security || scope.code === AI_MEDIA_ACCESS_DENIED,
    };
  }
  return { resolvable: true, reason: "media_object_path", bucketRelativePath: scope.bucketRelativePath };
}
