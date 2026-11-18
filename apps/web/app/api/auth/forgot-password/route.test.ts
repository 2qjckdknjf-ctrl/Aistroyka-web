import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";

const resetPasswordForEmail = vi.fn();
const createServerClient = vi.fn();
const checkRateLimit = vi.fn();
const getAdminClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => createServerClient(...args),
}));

vi.mock("@/lib/config", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => getAdminClient(),
}));

vi.mock("@/lib/platform/rate-limit/rate-limit.service", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

vi.mock("@/lib/observability", () => ({
  getOrCreateTraceId: () => "trace-1",
  logStructured: vi.fn(),
}));

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminClient.mockReturnValue(null);
    resetPasswordForEmail.mockResolvedValue({ error: null });
    createServerClient.mockReturnValue({
      auth: { resetPasswordForEmail },
    });
  });

  it("rejects invalid email", async () => {
    const request = new Request("https://aistroyka.ai/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it("sends reset email with recovery callback", async () => {
    const request = new Request("https://aistroyka.ai/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", locale: "en" }),
    });
    const response = await POST(request as never);
    expect(response.status).toBe(200);
    expect(resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "https://aistroyka.ai/api/auth/callback?callback=%2Fen%2Freset-password&recovery=1",
    });
  });

  it("rate-limits using cf-connecting-ip when present", async () => {
    getAdminClient.mockReturnValue({});
    checkRateLimit.mockResolvedValue({ limited: false });
    const request = new Request("https://aistroyka.ai/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cf-connecting-ip": "203.0.113.10",
        "x-forwarded-for": "198.51.100.99",
      },
      body: JSON.stringify({ email: "user@example.com" }),
    });
    await POST(request as never);
    expect(checkRateLimit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ip: "203.0.113.10" })
    );
  });
});
