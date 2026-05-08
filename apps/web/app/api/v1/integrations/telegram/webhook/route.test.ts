import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import * as admin from "@/lib/supabase/admin";
import * as telegramRepo from "@/lib/platform/telegram/telegram.repository";
import * as telegramApi from "@/lib/platform/telegram/telegram-api.client";

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));
vi.mock("@/lib/platform/telegram/telegram.repository", () => ({
  consumeLinkToken: vi.fn(),
  replaceUserTelegramLink: vi.fn(),
  insertDeliveryAudit: vi.fn(),
}));
vi.mock("@/lib/platform/telegram/telegram-api.client", () => ({
  sendTelegramMessage: vi.fn(),
}));

describe("POST /api/v1/integrations/telegram/webhook", () => {
  const prevEnv = { NODE_ENV: process.env.NODE_ENV, SECRET: process.env.TELEGRAM_WEBHOOK_SECRET };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_WEBHOOK_SECRET = "sec";
  });

  afterEach(() => {
    process.env.NODE_ENV = prevEnv.NODE_ENV;
    process.env.TELEGRAM_WEBHOOK_SECRET = prevEnv.SECRET;
  });

  it("returns 401 when secret header mismatches", async () => {
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    const res = await POST(
      new Request("https://t.test/webhook", {
        method: "POST",
        headers: { "X-Telegram-Bot-Api-Secret-Token": "wrong" },
        body: JSON.stringify({ message: { chat: { id: 1 }, text: "/start abc" } }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 503 in production when webhook secret unset", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    const res = await POST(new Request("https://t.test/webhook", { method: "POST", body: "{}" }));
    expect(res.status).toBe(503);
  });

  it("completes link and confirms via Telegram", async () => {
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    vi.mocked(telegramRepo.consumeLinkToken).mockResolvedValue({ tenantId: "t1", userId: "u1" });
    vi.mocked(telegramRepo.replaceUserTelegramLink).mockResolvedValue(true);
    vi.mocked(telegramApi.sendTelegramMessage).mockResolvedValue({ ok: true });

    const res = await POST(
      new Request("https://t.test/webhook", {
        method: "POST",
        headers: { "X-Telegram-Bot-Api-Secret-Token": "sec" },
        body: JSON.stringify({
          message: {
            chat: { id: 4242 },
            from: { id: 9001 },
            text: "/start deadbeef",
          },
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(telegramRepo.replaceUserTelegramLink).toHaveBeenCalledWith(expect.anything(), {
      tenantId: "t1",
      userId: "u1",
      telegramUserId: "9001",
      telegramChatId: "4242",
    });
  });
});
