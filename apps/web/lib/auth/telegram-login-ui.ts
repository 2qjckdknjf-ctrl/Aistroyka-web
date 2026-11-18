/** Login/register may offer Telegram only when the public bot username is configured. */
export function isTelegramLoginUiEnabled(
  publicUsername: string | null | undefined = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
): boolean {
  return Boolean(publicUsername?.replace(/^@/, "").trim());
}
