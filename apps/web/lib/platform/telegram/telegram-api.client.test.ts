import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { sendTelegramMessage } from "./telegram-api.client";

describe("telegram-api.client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    process.env.TELEGRAM_BOT_TOKEN = "123:ABC";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TELEGRAM_BOT_TOKEN;
    vi.clearAllMocks();
  });

  it("returns error when token missing", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const r = await sendTelegramMessage({ chatId: "1", text: "hi" });
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns ok when Telegram API accepts", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    const r = await sendTelegramMessage({ chatId: "99", text: "hello" });
    expect(r.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).chat_id).toBe("99");
  });
});
