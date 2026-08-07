/**
 * Centralized media object-path normalization + tenant path classification.
 * Pure helpers — safe to mirror from the recovery .mjs script (parity-tested).
 *
 * Storage layouts (bucket-relative):
 * - Upload sessions: `{tenantId}/{sessionId}/...`
 * - Legacy project upload: `{projectId}/{uuid}.ext`
 *
 * IMPORTANT: A bare project UUID is NOT authorization.
 * Project-prefixed paths require async DB proof via verifyProjectBelongsToTenant
 * inside createSignedUrlForPath (or recovery's proveProjectOwnership).
 */

import { AI_ERROR_CODES, type AIErrorCode } from "./ai-media-errors";
import { MEDIA_BUCKET } from "./media-bucket.constants";

export type MediaPathGuardFailureCode =
  | typeof AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED
  | typeof AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE;

export type MediaPathGuardResult =
  | { ok: true; bucketRelativePath: string }
  | { ok: false; code: MediaPathGuardFailureCode; reason: string };

/** Sync classification of a normalized path relative to a tenant. */
export type MediaPathScopeInspection =
  | { kind: "tenant_prefixed"; bucketRelativePath: string }
  | {
      kind: "project_prefix_candidate";
      projectIdCandidate: string;
      bucketRelativePath: string;
    }
  | { kind: "denied"; code: MediaPathGuardFailureCode; reason: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Reject incomplete / malformed percent-encoding without throwing. */
export function hasMalformedPercentEncoding(value: string): boolean {
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
 * Does NOT authorize tenant/project scope.
 */
export function normalizeMediaObjectPath(raw: string): MediaPathGuardResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Empty storage path",
    };
  }

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

  if (/\s/.test(decoded)) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Whitespace in storage path",
    };
  }

  let pathOnly = decoded.split("?")[0]!.split("#")[0]!;
  pathOnly = pathOnly.replace(/\/+/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");

  if (!pathOnly) {
    return {
      ok: false,
      code: AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE,
      reason: "Empty storage path",
    };
  }

  while (pathOnly === MEDIA_BUCKET || pathOnly.startsWith(`${MEDIA_BUCKET}/`)) {
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
 * Classify path layout vs tenant.
 * - tenant_prefixed: may be signed after this sync check
 * - project_prefix_candidate: first segment is a UUID ≠ tenantId; requires DB ownership proof
 * - denied: not under tenant and not a project-prefix candidate
 *
 * Never treats a caller-supplied project UUID as authorization.
 */
export function inspectMediaPathScope(
  rawPath: string,
  tenantId: string
): MediaPathScopeInspection {
  if (!tenantId || !isUuid(tenantId)) {
    return {
      kind: "denied",
      code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
      reason: "Invalid tenant scope",
    };
  }

  const normalized = normalizeMediaObjectPath(rawPath);
  if (!normalized.ok) {
    return { kind: "denied", code: normalized.code, reason: normalized.reason };
  }

  const path = normalized.bucketRelativePath;
  const tenantPrefix = `${tenantId}/`;
  if (path.startsWith(tenantPrefix) && path.length > tenantPrefix.length) {
    return { kind: "tenant_prefixed", bucketRelativePath: path };
  }

  const first = path.split("/")[0] ?? "";
  if (isUuid(first) && first !== tenantId && path.length > first.length + 1) {
    return {
      kind: "project_prefix_candidate",
      projectIdCandidate: first,
      bucketRelativePath: path,
    };
  }

  return {
    kind: "denied",
    code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
    reason: "Storage path outside tenant scope",
  };
}

/**
 * Sync tenant-prefix-only authorization.
 * Project-prefixed legacy paths are NOT authorized here — they need DB proof.
 */
export function assertMediaPathTenantScope(
  rawPath: string,
  tenantId: string
): MediaPathGuardResult {
  const inspection = inspectMediaPathScope(rawPath, tenantId);
  switch (inspection.kind) {
    case "tenant_prefixed":
      return { ok: true, bucketRelativePath: inspection.bucketRelativePath };
    case "project_prefix_candidate":
      return {
        ok: false,
        code: AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED,
        reason: "Project-prefixed path requires ownership proof",
      };
    case "denied":
      return { ok: false, code: inspection.code, reason: inspection.reason };
    default: {
      const _exhaustive: never = inspection;
      return _exhaustive;
    }
  }
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
    return null;
  }

  const prefixes = [
    `/storage/v1/object/public/${MEDIA_BUCKET}/`,
    `/storage/v1/object/sign/${MEDIA_BUCKET}/`,
    `/storage/v1/object/authenticated/${MEDIA_BUCKET}/`,
  ];

  const pathname = parsed.pathname;
  let encodedObjectPath: string | null = null;
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix)) {
      encodedObjectPath = pathname.slice(prefix.length);
      break;
    }
  }
  if (!encodedObjectPath) return null;

  return normalizeMediaObjectPath(encodedObjectPath);
}

export function isDeniedMediaPathCode(code: AIErrorCode): boolean {
  return (
    code === AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED ||
    code === AI_ERROR_CODES.AI_MEDIA_CORRUPT_REFERENCE
  );
}
