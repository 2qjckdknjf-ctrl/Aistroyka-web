import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health/auth", () => {
  it("returns 404 when diag is disabled (production, ENABLE_DIAG_ROUTES not set)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENABLE_DIAG_ROUTES", undefined);
    const res = await GET();
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error?: string };
    expect(data.error).toBe("Not available");
  });

  it("returns 200 with hasSupabaseEnv when diag is enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENABLE_DIAG_ROUTES", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as { hasSupabaseEnv?: boolean; authConfigured?: boolean };
    expect(data).toHaveProperty("hasSupabaseEnv");
    expect(data).toHaveProperty("authConfigured");
  });
});
