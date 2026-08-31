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
          identities: [
            {
              id: "apple-auth-id",
              identity_id: "apple-identity-id",
              provider: "apple",
              identity_data: { sub: "apple-sub-1", email: "user@example.com" },
            },
          ],
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

  it("redirects recovery flow to reset-password without onboarding checks", async () => {
    const request = new Request(
      "https://aistroyka.ai/api/auth/callback?code=test-code&callback=%2Fen%2Freset-password&recovery=1"
    );
    const response = await GET(request as never);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/en/reset-password");
    expect(hasTenantMembership).not.toHaveBeenCalled();
  });

  it("rejects open-redirect callback bypass on recovery flow", async () => {
    const request = new Request(
      "https://aistroyka.ai/api/auth/callback?code=test-code&callback=%2F%0a%2F%2Fevil.com&recovery=1"
    );
    const response = await GET(request as never);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/en/reset-password");
    expect(response.headers.get("location")).not.toContain("evil.com");
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

  it("links requested Google identity even when Apple remains the primary provider", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
          app_metadata: { provider: "apple" },
          user_metadata: { full_name: "Alex Builder" },
          identities: [
            {
              id: "apple-auth-id",
              identity_id: "apple-identity-id",
              provider: "apple",
              identity_data: { sub: "apple-sub-1" },
            },
            {
              id: "google-auth-id",
              identity_id: "google-identity-id",
              provider: "google",
              identity_data: {
                sub: "google-sub-1",
                email: "user@example.com",
                name: "Alex Builder",
                picture: "https://example.com/a.png",
              },
            },
          ],
        },
      },
    });
    const request = new Request(
      "https://aistroyka.ai/api/auth/callback?code=test-code&intent=link&provider=google&callback=%2Fen%2Fdashboard%2Fsettings%2Fauth"
    );
    const response = await GET(request as never);
    expect(response.status).toBe(307);
    expect(linkIdentityRow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        user_id: "user-1",
        provider: "google",
        identity_id: "google-identity-id",
        provider_user_id: "google-sub-1",
      })
    );
  });
});
