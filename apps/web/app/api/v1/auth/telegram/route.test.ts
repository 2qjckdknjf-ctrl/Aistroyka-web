import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { POST } from "./route";

const createClient = vi.fn();
const getSessionUser = vi.fn();
const hasTenantMembership = vi.fn();
const ensureOnboardingProfileExists = vi.fn();
const linkIdentityRow = vi.fn();

const getAdminClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
  getSessionUser: (...args: unknown[]) => getSessionUser(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => getAdminClient(...args),
}));

vi.mock("@/lib/auth/multi-provider", () => ({
  ensureOnboardingProfileExists: (...args: unknown[]) => ensureOnboardingProfileExists(...args),
  hasTenantMembership: (...args: unknown[]) => hasTenantMembership(...args),
  linkIdentityRow: (...args: unknown[]) => linkIdentityRow(...args),
}));

function telegramHash(payload: { id: string; first_name: string; auth_date: string }, botToken: string): string {
  const dataCheckString = [`auth_date=${payload.auth_date}`, `first_name=${payload.first_name}`, `id=${payload.id}`].join("\n");
  const secret = createHash("sha256").update(botToken, "utf8").digest();
  return createHmac("sha256", secret).update(dataCheckString, "utf8").digest("hex");
}

describe("POST /api/v1/auth/telegram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = "test-token";
    getSessionUser.mockResolvedValue(null);
    hasTenantMembership.mockResolvedValue(false);
    ensureOnboardingProfileExists.mockResolvedValue(undefined);
    linkIdentityRow.mockResolvedValue({ ok: true });

    const adminFrom = vi.fn((table: string) => {
      if (table === "user_identities") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table: ${table}`);
    });
    getAdminClient.mockReturnValue({
      from: adminFrom,
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-1001" } },
            error: null,
          }),
        },
      },
    });

    createClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1001", email: "telegram_1001@telegram.aistroyka.local" } },
          error: null,
        }),
      },
    });
  });

  it("rejects stale auth_date", async () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 10_000;
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "1001",
          first_name: "Alex",
          auth_date: String(oldTimestamp),
          hash: "deadbeef",
        }),
      })
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("stale_auth_date");
  });

  it("rejects invalid hash", async () => {
    const now = Math.floor(Date.now() / 1000);
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "1001",
          first_name: "Alex",
          auth_date: String(now),
          hash: "invalid",
        }),
      })
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("invalid_hash");
  });

  it("does not auto-create tenant membership after Telegram login", async () => {
    const now = String(Math.floor(Date.now() / 1000));
    const hash = telegramHash({ id: "1001", first_name: "Alex", auth_date: now }, "test-token");
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "1001",
          first_name: "Alex",
          auth_date: now,
          hash,
          locale: "ru",
        }),
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.hasTenantMembership).toBe(false);
    expect(body.next).toBe("/ru/dashboard?onboarding=1");
  });

  it("returns safe conflict when telegram identity belongs to another user", async () => {
    linkIdentityRow.mockResolvedValueOnce({ ok: false, code: "identity_conflict" });
    const now = String(Math.floor(Date.now() / 1000));
    const hash = telegramHash({ id: "1001", first_name: "Alex", auth_date: now }, "test-token");
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "1001",
          first_name: "Alex",
          auth_date: now,
          hash,
          locale: "ru",
        }),
      })
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("identity_conflict");
  });
  it("does not bind a new Telegram identity to an existing session", async () => {
    getSessionUser.mockResolvedValueOnce({ id: "attacker-user" });
    const now = String(Math.floor(Date.now() / 1000));
    const hash = telegramHash({ id: "1001", first_name: "Alex", auth_date: now }, "test-token");
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "1001",
          first_name: "Alex",
          auth_date: now,
          hash,
          locale: "ru",
        }),
      })
    );
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("telegram_link_requires_verified_flow");
    expect(linkIdentityRow).not.toHaveBeenCalled();
  });

  it("rejects a Telegram identity owned by another account before any upsert", async () => {
    getSessionUser.mockResolvedValueOnce({ id: "attacker-user" });
    getAdminClient.mockReturnValueOnce({
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { user_id: "victim-user" }, error: null }),
            }),
          }),
        }),
      })),
      auth: { admin: { createUser: vi.fn() } },
    });
    const now = String(Math.floor(Date.now() / 1000));
    const hash = telegramHash({ id: "1001", first_name: "Alex", auth_date: now }, "test-token");
    const response = await POST(
      new Request("https://aistroyka.ai/api/v1/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "1001",
          first_name: "Alex",
          auth_date: now,
          hash,
          locale: "ru",
        }),
      })
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("identity_conflict");
    expect(linkIdentityRow).not.toHaveBeenCalled();
  });
});
