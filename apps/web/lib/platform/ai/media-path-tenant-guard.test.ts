import { describe, expect, it } from "vitest";
import { AI_ERROR_CODES } from "./ai-media-errors";
import {
  assertMediaPathTenantScope,
  extractAndNormalizeStorageUrlPath,
  normalizeMediaObjectPath,
  safeDecodePath,
} from "./media-path-tenant-guard";

const tenantA = "11111111-1111-4111-8111-111111111111";
const tenantB = "22222222-2222-4222-8222-222222222222";
const projectA = "55555555-5555-4555-8555-555555555555";
const supabase = "https://abc.supabase.co";

describe("media-path-tenant-guard", () => {
  it("accepts valid tenant path and rejects similar prefix", () => {
    const ok = assertMediaPathTenantScope(`${tenantA}/sess/file.jpg`, tenantA);
    expect(ok).toEqual({ ok: true, bucketRelativePath: `${tenantA}/sess/file.jpg` });

    const similar = "11111111-1111-4111-8111-111111111111abcd/x.jpg";
    // craft a uuid-like longer first segment by appending — use different uuid that shares prefix chars
    const almost = assertMediaPathTenantScope(
      `${tenantA}a/file.jpg`,
      tenantA
    );
    expect(almost.ok).toBe(false);
    if (!almost.ok) expect(almost.code).toBe(AI_ERROR_CODES.AI_MEDIA_ACCESS_DENIED);

    void similar;
  });

  it("allows legacy project-prefixed path only when projectId provided", () => {
    const without = assertMediaPathTenantScope(`${projectA}/photo.jpg`, tenantA);
    expect(without.ok).toBe(false);

    const withProject = assertMediaPathTenantScope(`${projectA}/photo.jpg`, tenantA, projectA);
    expect(withProject.ok).toBe(true);
  });

  it("rejects traversal and encoded traversal", () => {
    expect(normalizeMediaObjectPath(`${tenantA}/../${tenantB}/x.jpg`).ok).toBe(false);
    expect(normalizeMediaObjectPath(`${tenantA}/%2e%2e/${tenantB}/x.jpg`).ok).toBe(false);
    expect(safeDecodePath("%2e%2e%2fsecret")).toBe("../secret");
    const encoded = normalizeMediaObjectPath(`${tenantA}/%2e%2e/${tenantB}/x.jpg`);
    expect(encoded.ok).toBe(false);
  });

  it("rejects double-encoded traversal", () => {
    // %252e%252e%252f → %2e%2e%2f → ../
    const raw = `${tenantA}/%252e%252e%252f${tenantB}/x.jpg`;
    const result = normalizeMediaObjectPath(raw);
    expect(result.ok).toBe(false);
  });

  it("rejects backslash, null byte, whitespace, malformed percent", () => {
    expect(normalizeMediaObjectPath(`${tenantA}\\file.jpg`).ok).toBe(false);
    expect(normalizeMediaObjectPath(`${tenantA}/fi\0le.jpg`).ok).toBe(false);
    expect(normalizeMediaObjectPath(`${tenantA}/fi le.jpg`).ok).toBe(false);
    expect(normalizeMediaObjectPath(`${tenantA}/file%.jpg`).ok).toBe(false);
    expect(safeDecodePath("%zz")).toBeNull();
  });

  it("strips double media/media prefix", () => {
    const n = normalizeMediaObjectPath(`media/media/${tenantA}/s/a.jpg`);
    expect(n).toEqual({ ok: true, bucketRelativePath: `${tenantA}/s/a.jpg` });
  });

  it("rejects other origin and extracts our public/auth/sign URLs", () => {
    expect(
      extractAndNormalizeStorageUrlPath("https://evil.example/storage/v1/object/public/media/x", supabase)
    ).toBeNull();

    const pub = extractAndNormalizeStorageUrlPath(
      `${supabase}/storage/v1/object/public/media/${tenantA}/a.jpg`,
      supabase
    );
    expect(pub).toEqual({ ok: true, bucketRelativePath: `${tenantA}/a.jpg` });

    const auth = extractAndNormalizeStorageUrlPath(
      `${supabase}/storage/v1/object/authenticated/media/${tenantA}/a.jpg`,
      supabase
    );
    expect(auth).toEqual({ ok: true, bucketRelativePath: `${tenantA}/a.jpg` });

    const signed = extractAndNormalizeStorageUrlPath(
      `${supabase}/storage/v1/object/sign/media/${tenantA}/a.jpg?token=abc`,
      supabase
    );
    expect(signed).toEqual({ ok: true, bucketRelativePath: `${tenantA}/a.jpg` });
  });

  it("does not throw on malformed URL", () => {
    const result = extractAndNormalizeStorageUrlPath("https://abc.supabase.co/%", supabase);
    expect(result === null || result.ok === false).toBe(true);
  });

  it("returns null for bare object paths (not URLs)", () => {
    expect(extractAndNormalizeStorageUrlPath(`${tenantA}/file.jpg`, supabase)).toBeNull();
    expect(extractAndNormalizeStorageUrlPath(`media/${tenantA}/file.jpg`, supabase)).toBeNull();
  });
});
