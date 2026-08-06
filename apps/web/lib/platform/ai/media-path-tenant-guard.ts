/**
 * Centralized media object-path normalization + tenant authorization.
 * Pure helpers — safe to mirror from the recovery .mjs script (parity-tested).
 *
 * Storage layouts (bucket-relative):
 * - Upload sessions: `{tenantId}/{sessionId}/...`
 * - Legacy project upload: `{projectId}/{uuid}.ext`
 */

import { AI_ERROR_CODES, type AIErrorCode } from "./ai-media-errors";
import { MEDIA_BUCKET } from "./media-bucket.constants";

export type MediaPathGuardFailureCode =
  | typeof AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED
  | typeof AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE;

export type MediaPathGuardResult =
  | { ok: true; bucketRelativePath: string }
  | { ok: false; code: MediaPathGuardFailureCode; reason: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Reject incomplete / malformed percent-encoding without throwing. */
export function hasMalformedPercentEncoding(value: string): boolean {
  // Any '%' must start a valid %HH sequence.
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== "%") continue;
    const h1 = value[i + 1];
    const h2 = value[i + 2];
    if (
      !h1 ||
      !h2 ||
      !/[0-9a-fA-F]/.test(h1) ||
      !/[0-9a-fA-F]/.test(h2)
    ) {
      return true;
    }
    i += 2;
  }
  return false;
}

/**
 * Iteratively percent-decode a path-like string (max 3 rounds).
 * Returns null on malformed encoding or decode failure (never throws).
 */
export function safeDecodePath(raw: string): string | null {
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

/**
 * Normalize a storage object reference into a bucket-relative path.
 * Does NOT authorize tenant scope — call assertMediaPathTenantScope next.
 */
export function normalizeMediaObjectPath(raw: string): MediaPathGuardResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Empty storage path",
    };
  }

  // Reject before decode
  if (raw.includes("\0") || raw.includes("\\")) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Invalid path characters",
    };
  }

  const decoded = safeDecodePath(raw.trim());
  if (decoded == null) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Malformed path encoding",
    };
  }

  if (decoded.includes("\0") || decoded.includes("\\")) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Invalid path characters after decode",
    };
  }

  // Reject whitespace inside the path (after end-trim already applied on input)
  if (/\s/.test(decoded)) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Whitespace in storage path",
    };
  }

  // Drop query/hash if somehow present on a path-like string
  let pathOnly = decoded.split("?")[0]!.split("#")[0]!;

  // Normalize separators: collapse repeated slashes; strip leading slashes
  pathOnly = pathOnly.replace(/\/+/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");

  if (!pathOnly) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Empty storage path",
    };
  }

  // Strip one or more leading media/ bucket prefixes (legacy double media/media/)
  while (
    pathOnly === MEDIA_BUCKET ||
    pathOnly.startsWith(`${MEDIA_BUCKET}/`)
  ) {
    if (pathOnly === MEDIA_BUCKET) {
      return {
        ok: false,
        code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
        reason: "Bucket-only path",
      };
    }
    pathOnly = pathOnly.slice(MEDIA_BUCKET.length + 1);
  }

  const segments = pathOnly.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Path traversal or empty segment",
    };
  }

  return { ok: true, bucketRelativePath: segments.join("/") };
}

/**
 * Authorize a bucket-relative (or raw) path for the given tenant.
 * Requires first segment === tenantId, or === projectId when projectId is provided.
 * Prefix matching is slash-bounded (tenant `abc` cannot authorize `abcd/...`).
 */
export function assertMediaPathTenantScope(
  rawPath: string,
  tenantId: string,
  projectId?: string | null
): MediaPathGuardResult {
  if (!tenantId || !isUuid(tenantId)) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      reason: "Invalid tenant scope",
    };
  }

  const normalized = normalizeMediaObjectPath(rawPath);
  if (!normalized.ok) return normalized;

  const path = normalized.bucketRelativePath;
  const tenantPrefix = `${tenantId}/`;
  const underTenant = path.startsWith(tenantPrefix) && path.length > tenantPrefix.length;

  let underProject = false;
  if (projectId && isUuid(projectId)) {
    const projectPrefix = `${projectId}/`;
    underProject =
      path.startsWith(projectPrefix) && path.length > projectPrefix.length;
  }

  if (!underTenant && !underProject) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      reason: "Storage path outside tenant scope",
    };
  }

  return { ok: true, bucketRelativePath: path };
}

/**
 * Extract + normalize a media object path from our Supabase Storage URL.
 * Returns null for other origins / unrecognized shapes (never throws).
 */
export function extractAndNormalizeStorageUrlPath(
  url: string,
  supabaseUrl: string
): MediaPathGuardResult | null {
  if (typeof url !== "string" || !url.trim() || !supabaseUrl) return null;

  const trimmed = url.trim();
  // Object paths are not URLs — callers must normalize via normalizeMediaObjectPath.
  if (!/^https?:\/\//i.test(trimmed)) return null;

  let baseOrigin: string;
  try {
    baseOrigin = new URL(supabaseUrl).origin;
  } catch {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Malformed storage URL",
    };
  }

  if (parsed.origin !== baseOrigin) {
    return null; // not our storage — caller treats as external
  }

  const prefixes = [
    `/storage/v1/object/public/${MEDIA_BUCKET}/`,
    `/storage/v1/object/sign/${MEDIA_BUCKET}/`,
    `/storage/v1/object/authenticated/${MEDIA_BUCKET}/`,
  ];

  const pathname = parsed.pathname; // query/hash already excluded by URL.pathname
  let encodedObjectPath: string | null = null;
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix)) {
      encodedObjectPath = pathname.slice(prefix.length);
      break;
    }
  }
  if (!encodedObjectPath) return null;

  // Query tokens must not be treated as path; pathname already excludes query.
  // Still normalize/decode via shared guard (handles %2e%2e etc.).
  return normalizeMediaObjectPath(encodedObjectPath);
}

export function isDeniedMediaPathCode(code: AIErrorCode): boolean {
  return (
    code === AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED ||
    code === AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE
  );
}
