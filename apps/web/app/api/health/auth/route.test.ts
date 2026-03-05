import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health/auth", () => {
  it("returns 404 when debug auth is not allowed (production, no allowlist)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DIAG_ROUTES", undefined);
    vi.stubEnv("DEBUG_AUTH", undefined);
    vi.stubEnv("ALLOW_DEBUG_HOSTS", undefined);
    const req = new Request("http://localhost/api/health/auth");
    const res = await GET(req);
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe("Not available");
  });

  it("returns 200 with hasSupabaseEnv when debug auth is allowed (development)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DIAG_ROUTES", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const req = new Request("http://localhost/api/health/auth");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { hasSupabaseEnv?: boolean; authConfigured?: boolean };
    expect(data).toHaveProperty("hasSupabaseEnv");
    expect(data).toHaveProperty("authConfigured");
  });
});
