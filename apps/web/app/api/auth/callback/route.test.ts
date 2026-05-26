import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

const exchangeCodeForSession = vi.fn();
const getUser = vi.fn();
const createClient = vi.fn();
const ensureOnboardingProfileExists = vi.fn();
const hasTenantMembership = vi.fn();
const linkIdentityRow = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
}));

vi.mock("@/lib/auth/multi-provider", () => ({
  ensureOnboardingProfileExists: (...args: unknown[]) => ensureOnboardingProfileExists(...args),
  hasTenantMembership: (...args: unknown[]) => hasTenantMembership(...args),
  linkIdentityRow: (...args: unknown[]) => linkIdentityRow(...args),
}));

describe("GET /api/auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exchangeCodeForSession.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
          app_metadata: { provider: "apple" },
          user_metadata: { sub: "apple-sub-1", full_name: "Alex Builder" },
        },
      },
    });
    createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession,
        getUser,
      },
    });
    ensureOnboardingProfileExists.mockResolvedValue(undefined);
    hasTenantMembership.mockResolvedValue(true);
    linkIdentityRow.mockResolvedValue({ ok: true });
  });

  it("redirects to dashboard when tenant membership exists", async () => {
    const request = new Request("https://aistroyka.ai/api/auth/callback?code=test-code");
    const response = await GET(request as never);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/en/dashboard");
    expect(hasTenantMembership).toHaveBeenCalled();
  });

  it("redirects to onboarding flow when membership is absent", async () => {
    hasTenantMembership.mockResolvedValue(false);
    const request = new Request("https://aistroyka.ai/api/auth/callback?code=test-code");
    const response = await GET(request as never);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/en/dashboard?onboarding=1");
  });
});
