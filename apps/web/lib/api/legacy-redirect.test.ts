import { describe, expect, it, vi } from "vitest";
import {
  applyLegacyDeprecationHeaders,
  redirectDeprecatedApiToV1,
  redirectLegacyApiToV1,
  redirectToV1PreservePath,
} from "./legacy-redirect";
import { LEGACY_API_HEADERS } from "./deprecation-headers";

describe("legacy-redirect", () => {
  it("redirectDeprecatedApiToV1 auto-maps /api/* to /api/v1/* with query", () => {
    const req = new Request("https://example.com/api/tenant/invite?x=1", { method: "POST" });
    const res = redirectDeprecatedApiToV1(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://example.com/api/v1/tenant/invite?x=1");
    expect(res.headers.get("Deprecation")).toBe("true");
    expect(res.headers.get("Sunset")).toBe(LEGACY_API_HEADERS.Sunset);
    expect(res.headers.get("Link")).toBe('</api/v1/tenant/invite>; rel="successor"');
  });

  it("redirectDeprecatedApiToV1 supports explicit canonical target", () => {
    const req = new Request("https://example.com/api/invite?role=admin", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com" }),
    });
    const res = redirectDeprecatedApiToV1(req, "/api/v1/tenant/invite");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://example.com/api/v1/tenant/invite?role=admin"
    );
    expect(res.headers.get("Link")).toBe('</api/v1/tenant/invite>; rel="successor"');
    // Body must remain unread for the client to re-send on 307 follow.
    expect(req.bodyUsed).toBe(false);
  });

  it("does not duplicate query string or change origin", () => {
    const req = new Request("https://origin.test/api/tenant/members?a=1&a=1", { method: "GET" });
    const res = redirectToV1PreservePath(req);
    expect(res.headers.get("location")).toBe("https://origin.test/api/v1/tenant/members?a=1&a=1");
  });

  it("does not create /api/v1/v1 loops on already-v1 paths when auto-mapping", () => {
    // Auto-map only replaces leading /api/ once; callers must not pass v1 URLs as legacy.
    const req = new Request("https://example.com/api/tenant/profile", { method: "PATCH" });
    const res = redirectToV1PreservePath(req);
    const loc = res.headers.get("location")!;
    expect(loc).toBe("https://example.com/api/v1/tenant/profile");
    expect(loc.includes("/api/v1/v1/")).toBe(false);
  });

  it("redirectToV1PreservePath maps /api/* to /api/v1/* with query and deprecation headers", () => {
    const req = new Request("https://example.com/api/tenant/invite?x=1", { method: "POST" });
    const res = redirectToV1PreservePath(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://example.com/api/v1/tenant/invite?x=1");
    expect(res.headers.get("Deprecation")).toBe("true");
  });

  it("redirectLegacyApiToV1 forbids lite without redirect", async () => {
    const req = new Request("https://example.com/api/projects?q=1", {
      method: "POST",
      headers: { "x-client": "android_worker" },
      body: JSON.stringify({ name: "x" }),
    });
    const res = redirectLegacyApiToV1(req);
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("lite_client_path_forbidden");
  });

  it("redirectLegacyApiToV1 redirects non-lite with deprecation headers and successor Link", () => {
    const req = new Request("https://example.com/api/projects/p1/upload?foo=bar", {
      method: "POST",
      headers: { "x-client": "web" },
    });
    const res = redirectLegacyApiToV1(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://example.com/api/v1/projects/p1/upload?foo=bar"
    );
    expect(res.headers.get("Deprecation")).toBe("true");
    expect(res.headers.get("Sunset")).toBeTruthy();
    expect(res.headers.get("Link")).toBe('</api/v1/projects/p1/upload>; rel="successor"');
  });

  it("applyLegacyDeprecationHeaders preserves status/body and adds contract headers", async () => {
    const upstream = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json", "x-existing": "1" },
    });
    const out = applyLegacyDeprecationHeaders(upstream, "/api/v1/webhooks/incoming");
    expect(out.status).toBe(200);
    expect(out.headers.get("x-existing")).toBe("1");
    expect(out.headers.get("Deprecation")).toBe("true");
    expect(out.headers.get("Sunset")).toBe(LEGACY_API_HEADERS.Sunset);
    expect(out.headers.get("Link")).toBe('</api/v1/webhooks/incoming>; rel="successor"');
    expect(await out.json()).toEqual({ ok: true });
  });

  it("rejects explicit canonicalPath outside /api/v1", () => {
    const req = new Request("https://example.com/api/invite", { method: "POST" });
    expect(() => redirectDeprecatedApiToV1(req, "/api/invite")).toThrow(/canonicalPath/);
  });
});
