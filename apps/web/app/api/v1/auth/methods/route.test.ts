import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const createClient = vi.fn();
const getSessionUser = vi.fn();
const getUserIdentities = vi.fn();
const linkIdentityRow = vi.fn();
const unlinkIdentityRow = vi.fn();
const unlinkSupabaseAuthProvider = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
  getSessionUser: (...args: unknown[]) => getSessionUser(...args),
}));

vi.mock("@/lib/auth/multi-provider", () => ({
  getUserIdentities: (...args: unknown[]) => getUserIdentities(...args),
  linkIdentityRow: (...args: unknown[]) => linkIdentityRow(...args),
  unlinkIdentityRow: (...args: unknown[]) => unlinkIdentityRow(...args),
  unlinkSupabaseAuthProvider: (...args: unknown[]) => unlinkSupabaseAuthProvider(...args),
  summarizeAuthMethods: (email: string | undefined, identities: Array<{ provider?: string }>) => {
    const hasApple = identities.some((identity) => identity.provider === "apple");
    const hasTelegram = identities.some((identity) => identity.provider === "telegram");
    const hasGoogle = identities.some((identity) => identity.provider === "google");
    const hasEmail = Boolean(email);
    return {
      email: hasEmail,
      apple: hasApple,
      telegram: hasTelegram,
      google: hasGoogle,
      linkedCount: Number(hasEmail) + Number(hasApple) + Number(hasTelegram) + Number(hasGoogle),
    };
  },
}));

function row(provider: "apple" | "telegram" | "google") {
  return {
    id: `${provider}-row`,
    user_id: "user-1",
    provider,
    identity_id: `${provider}-identity`,
    provider_user_id: `${provider}-sub`,
    email: "a@b.com",
    username: null,
    full_name: null,
    avatar_url: null,
    metadata: {},
    created_at: "",
    updated_at: "",
  };
}

describe("GET/POST /api/v1/auth/methods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({ auth: {} });
    getSessionUser.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      identities: [{ provider: "email" }],
    });
    getUserIdentities.mockResolvedValue([row("telegram")]);
    linkIdentityRow.mockResolvedValue({ ok: true });
    unlinkIdentityRow.mockResolvedValue(true);
    unlinkSupabaseAuthProvider.mockResolvedValue(true);
  });

  it("returns a real password/email method plus linked providers", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.methods.email).toBe(true);
    expect(body.methods.telegram).toBe(true);
  });

  it("does not count an OAuth email claim as a password method", async () => {
    getSessionUser.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      identities: [{ provider: "google" }],
    });
    getUserIdentities.mockResolvedValue([row("google")]);
    const response = await GET();
    const body = await response.json();
    expect(body.methods.email).toBe(false);
    expect(body.methods.google).toBe(true);
    expect(body.linkedCount).toBe(1);
  });

  it("forbids unlinking the last remaining real method", async () => {
    getSessionUser.mockResolvedValue({
      id: "user-1",
      email: "a@b.com",
      identities: [{ provider: "google" }],
    });
    getUserIdentities.mockResolvedValue([row("google")]);
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink", provider: "google" }),
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("last_method_forbidden");
    expect(unlinkIdentityRow).not.toHaveBeenCalled();
  });

  it("deletes the mirror row before Auth unlink and returns updated methods", async () => {
    getUserIdentities
      .mockResolvedValueOnce([row("google"), row("apple")])
      .mockResolvedValueOnce([row("apple")]);
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink", provider: "google" }),
      })
    );
    expect(response.status).toBe(200);
    expect(unlinkIdentityRow).toHaveBeenCalledWith(expect.anything(), "user-1", "google");
    expect(unlinkSupabaseAuthProvider).toHaveBeenCalledWith(expect.anything(), "google");
    const body = await response.json();
    expect(body.methods.google).toBe(false);
    expect(body.methods.apple).toBe(true);
  });

  it("restores the mirror row when Supabase Auth unlink fails", async () => {
    getUserIdentities.mockResolvedValue([row("google"), row("apple")]);
    unlinkSupabaseAuthProvider.mockResolvedValue(false);
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink", provider: "google" }),
      })
    );
    expect(response.status).toBe(500);
    expect(linkIdentityRow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        provider: "google",
        identity_id: "google-identity",
        provider_user_id: "google-sub",
      })
    );
  });

  it("fails closed when the database row was not actually deleted", async () => {
    getUserIdentities.mockResolvedValue([row("google"), row("apple")]);
    unlinkIdentityRow.mockResolvedValue(false);
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink", provider: "google" }),
      })
    );
    expect(response.status).toBe(500);
    expect(unlinkSupabaseAuthProvider).not.toHaveBeenCalled();
  });
});
