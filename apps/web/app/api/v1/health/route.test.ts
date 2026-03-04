import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/v1/health", () => {
  it("returns same contract as legacy health (ok, db, aiConfigured, openaiConfigured)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const res = await GET(new Request("http://test/api/v1/health"));
    expect(res.status).toBe(503);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data).toHaveProperty("ok", false);
    expect(data).toHaveProperty("db", "error");
    expect(data).toHaveProperty("aiConfigured");
    expect(data).toHaveProperty("openaiConfigured");
    expect(data).toHaveProperty("reason", "missing_supabase_env");
  });
});
