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

  it("includes aiConfigMissing (names only, no values) when AI env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("AI_ANALYSIS_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const res = await GET(new Request("http://test/api/health"));
    const data = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(data.aiConfigMissing)).toBe(true);
    const missing = data.aiConfigMissing as string[];
    expect(missing).toContain("OPENAI_API_KEY");
    expect(missing).toContain("AI_ANALYSIS_URL");
    expect(missing).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(missing.every((s) => typeof s === "string" && s.length > 0)).toBe(true);
  });

  it("aiConfigMissing is empty when all AI env vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("OPENAI_API_KEY", "sk-test");
    vi.stubEnv("AI_ANALYSIS_URL", "https://api.example.com/analyze");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    const res = await GET(new Request("http://test/api/health"));
    const data = (await res.json()) as Record<string, unknown>;
    expect(data.aiConfigMissing).toEqual([]);
  });
});
