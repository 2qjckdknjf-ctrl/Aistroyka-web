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
          identities: [
            {
              provider: "apple",
              identity_id: "apple-identity-1",
              identity_data: {
                sub: "apple-sub-1",
                email: "user@example.com",
                full_name: "Alex Builder",
              },
            },
          ],
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

  it("mirrors Apple identities even when email remains the primary provider", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
          app_metadata: { provider: "email", providers: ["email", "apple"] },
          identities: [
            {
              provider: "email",
              identity_id: "email-identity-1",
              identity_data: {
                email: "user@example.com",
              },
            },
            {
              provider: "apple",
              identity_id: "apple-identity-2",
              identity_data: {
                sub: "apple-sub-2",
                email: "apple-user@example.com",
                full_name: "Apple Linked User",
                picture: "https://example.com/apple-avatar.png",
              },
            },
          ],
          user_metadata: { full_name: "Email User" },
        },
      },
    });

    await GET(new Request("https://aistroyka.ai/api/auth/callback?code=test-code") as never);

    expect(linkIdentityRow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        user_id: "user-1",
        provider: "apple",
        provider_user_id: "apple-sub-2",
        email: "apple-user@example.com",
        full_name: "Apple Linked User",
        avatar_url: "https://example.com/apple-avatar.png",
      })
    );
  });

  it("preserves the active locale when next omits a locale prefix", async () => {
    const request = new Request("https://aistroyka.ai/api/auth/callback?code=test-code&callback=%2Fru%2Fdashboard&next=%2Fdashboard");
    const response = await GET(request as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/ru/dashboard");
  });
});
