import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns 503 and body with ok, db, aiConfigured, openaiConfigured when Supabase env is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const res = await GET(new Request("http://test/api/health"));
    expect(res.status).toBe(503);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data).toHaveProperty("ok", false);
    expect(data).toHaveProperty("db", "error");
    expect(data).toHaveProperty("aiConfigured");
    expect(data).toHaveProperty("openaiConfigured");
    expect(data).toHaveProperty("reason", "missing_supabase_env");
  });

  it("sets aiConfigured from AI_ANALYSIS_URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("AI_ANALYSIS_URL", "https://api.example.com/analyze");
    const res = await GET(new Request("http://test/api/health"));
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.aiConfigured).toBe(true);
  });

  it("sets openaiConfigured from OPENAI_API_KEY", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    const res = await GET(new Request("http://test/api/health"));
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.openaiConfigured).toBe(true);
  });
});
