/**
 * Minimal Telegram Bot HTTP client (sendMessage).
 * https://core.telegram.org/bots/api#sendmessage
 */

import { getTelegramBotToken } from "./telegram.config";

export type SendTelegramMessageResult = { ok: true } | { ok: false; error: string };

export async function sendTelegramMessage(params: { chatId: string; text: string }): Promise<SendTelegramMessageResult> {
  const token = getTelegramBotToken();
  if (!token) return { ok: false, error: "bot_token_missing" };

  const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: params.text,
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `http_${res.status}:${body.slice(0, 200)}` };
  }

  const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!json || json.ok !== true) {
    return { ok: false, error: json?.description ?? "telegram_api_error" };
  }
  return { ok: true };
}
