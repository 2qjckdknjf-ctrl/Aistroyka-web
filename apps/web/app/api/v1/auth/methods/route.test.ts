import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const createClient = vi.fn();
const getSessionUser = vi.fn();
const getUserIdentities = vi.fn();
const unlinkIdentityRow = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
  getSessionUser: (...args: unknown[]) => getSessionUser(...args),
}));

vi.mock("@/lib/auth/multi-provider", () => ({
  getUserIdentities: (...args: unknown[]) => getUserIdentities(...args),
  unlinkIdentityRow: (...args: unknown[]) => unlinkIdentityRow(...args),
  summarizeAuthMethods: (email: string | undefined, identities: Array<{ provider?: string }>) => {
    const hasApple = identities.some((identity) => identity.provider === "apple");
    const hasTelegram = identities.some((identity) => identity.provider === "telegram");
    const hasEmail = Boolean(email);
    return {
      email: hasEmail,
      apple: hasApple,
      telegram: hasTelegram,
      linkedCount: Number(hasEmail) + Number(hasApple) + Number(hasTelegram),
    };
  },
}));

describe("POST /api/v1/auth/methods", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({
      auth: {
        unlinkIdentity: vi.fn().mockResolvedValue({ error: null }),
      },
    });
    getSessionUser.mockResolvedValue({ id: "user-1", email: "a@b.com" });
    getUserIdentities.mockResolvedValue([{ provider: "telegram" }]);
    unlinkIdentityRow.mockResolvedValue(true);
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
});
