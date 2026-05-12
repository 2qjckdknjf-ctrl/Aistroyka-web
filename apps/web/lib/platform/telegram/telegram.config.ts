/** Server-only Telegram bot configuration (Phase 10). */

export function getTelegramBotToken(): string | null {
  const v = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return v && v.length > 0 ? v : null;
}

/** Must match secret_token set on setWebhook (header X-Telegram-Bot-Api-Secret-Token). */
export function getTelegramWebhookSecret(): string | null {
  const v = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  return v && v.length > 0 ? v : null;
}

/** Bot username without @ — used only to build https://t.me/... deep links. */
export function getTelegramBotUsername(): string | null {
  const v = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "").trim();
  return v && v.length > 0 ? v : null;
}

export function isTelegramBotConfigured(): boolean {
  return !!getTelegramBotToken() && !!getTelegramBotUsername();
}
