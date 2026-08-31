import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const createClient = vi.fn();
const getSessionUser = vi.fn();
const getUserIdentities = vi.fn();
const unlinkIdentityRow = vi.fn();
const unlinkSupabaseAuthProvider = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
  getSessionUser: (...args: unknown[]) => getSessionUser(...args),
}));

vi.mock("@/lib/auth/multi-provider", () => ({
  getUserIdentities: (...args: unknown[]) => getUserIdentities(...args),
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

describe("POST /api/v1/auth/methods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({ auth: {} });
    getSessionUser.mockResolvedValue({ id: "user-1", email: "a@b.com" });
    getUserIdentities.mockResolvedValue([{ provider: "telegram" }]);
    unlinkIdentityRow.mockResolvedValue(true);
    unlinkSupabaseAuthProvider.mockResolvedValue(true);
  });

  it("returns linked methods", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.methods.email).toBe(true);
    expect(body.methods.telegram).toBe(true);
  });

  it("forbids unlinking the last remaining method", async () => {
    getSessionUser.mockResolvedValue({ id: "user-1", email: undefined });
    getUserIdentities.mockResolvedValue([{ provider: "telegram" }]);
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink", provider: "telegram" }),
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("last_method_forbidden");
  });

  it("unlinks google through supabase auth then identity row", async () => {
    getUserIdentities
      .mockResolvedValueOnce([{ provider: "google" }, { provider: "apple" }])
      .mockResolvedValueOnce([{ provider: "apple" }]);
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink", provider: "google" }),
      })
    );
    expect(response.status).toBe(200);
    expect(unlinkSupabaseAuthProvider).toHaveBeenCalledWith(expect.anything(), "google");
    expect(unlinkIdentityRow).toHaveBeenCalledWith(expect.anything(), "user-1", "google");
    const body = await response.json();
    expect(body.methods.google).toBe(false);
    expect(body.methods.apple).toBe(true);
  });
});
