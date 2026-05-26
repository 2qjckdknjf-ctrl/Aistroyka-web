import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const TELEGRAM_AUTH_MAX_AGE_SECONDS = 300;

export type TelegramAuthPayload = {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
};

export function toTelegramDataCheckString(payload: TelegramAuthPayload): string {
  const pairs = [
    ["auth_date", payload.auth_date],
    ["first_name", payload.first_name],
    ["id", payload.id],
    ["last_name", payload.last_name ?? ""],
    ["photo_url", payload.photo_url ?? ""],
    ["username", payload.username ?? ""],
  ].filter(([, value]) => value !== "");
  return pairs
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export function verifyTelegramHash(
  payload: TelegramAuthPayload,
  botToken: string
): boolean {
  const secretKey = createHash("sha256").update(botToken, "utf8").digest();
  const dataCheckString = toTelegramDataCheckString(payload);
  const digest = createHmac("sha256", secretKey)
    .update(dataCheckString, "utf8")
    .digest("hex");
  const actual = Buffer.from(digest, "utf8");
  const expected = Buffer.from(payload.hash, "utf8");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function isTelegramAuthStale(
  authDateUnix: string,
  maxAgeSeconds = TELEGRAM_AUTH_MAX_AGE_SECONDS
): boolean {
  const authDate = Number(authDateUnix);
  if (!Number.isFinite(authDate)) return true;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - authDate) > maxAgeSeconds;
}

export function deriveTelegramPseudoEmail(telegramUserId: string): string {
  return `telegram_${telegramUserId}@telegram.aistroyka.local`;
}

export function deriveTelegramServicePassword(
  telegramUserId: string,
  botToken: string
): string {
  const digest = createHmac("sha256", botToken)
    .update(`telegram:${telegramUserId}`, "utf8")
    .digest("base64url");
  return `tg_${digest}`;
}
