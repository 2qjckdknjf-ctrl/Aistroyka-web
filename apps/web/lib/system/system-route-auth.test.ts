import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireSystemRouteAuth } from "./system-route-auth";

describe("requireSystemRouteAuth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when non-production and SYSTEM_API_KEY not set", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SYSTEM_API_KEY", "");
    const req = new Request("https://example.com/api/system/health");
    expect(requireSystemRouteAuth(req)).toBeNull();
  });

  it("returns 503 when production and SYSTEM_API_KEY not set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SYSTEM_API_KEY", "");
    const req = new Request("https://example.com/api/system/health");
    const res = requireSystemRouteAuth(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(503);
    expect(res!.headers.get("Content-Type")).toContain("application/json");
  });

  it("returns 401 when SYSTEM_API_KEY set but X-System-Key missing", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SYSTEM_API_KEY", "secret123");
    const req = new Request("https://example.com/api/system/health");
    const res = requireSystemRouteAuth(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it("returns 401 when SYSTEM_API_KEY set but X-System-Key wrong", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SYSTEM_API_KEY", "secret123");
    const req = new Request("https://example.com/api/system/health", {
      headers: { "X-System-Key": "wrong" },
    });
    const res = requireSystemRouteAuth(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it("returns null when SYSTEM_API_KEY set and X-System-Key matches", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SYSTEM_API_KEY", "secret123");
    const req = new Request("https://example.com/api/system/health", {
      headers: { "X-System-Key": "secret123" },
    });
    expect(requireSystemRouteAuth(req)).toBeNull();
  });

  it("treats NEXT_PUBLIC_APP_ENV=production as production when NODE_ENV unset", () => {
    vi.stubEnv("NODE_ENV", "");
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    vi.stubEnv("SYSTEM_API_KEY", "");
    const req = new Request("https://example.com/api/system/health");
    const res = requireSystemRouteAuth(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(503);
    expect(res!.headers.get("Content-Type")).toContain("application/json");
  });

  it("returns 401 (not health payload) when production + key set + wrong header", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SYSTEM_API_KEY", "secret123");
    const req = new Request("https://example.com/api/system/health");
    const res = requireSystemRouteAuth(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    const body = await res!.text();
    expect(body).not.toContain("database");
    expect(body).not.toContain("services");
    expect(body).toContain("Unauthorized");
  });
});
